#!/bin/bash
set -e
cd "$(dirname "$0")"

OUT=curl-transcript.txt
rm -f "$OUT"

node src/dummy_bank.js > /tmp/bank.log 2>&1 &
BANK_PID=$!
node src/app.js > /tmp/app.log 2>&1 &
APP_PID=$!
sleep 2

AUTH="Bearer demo-token-abc123"

section () {
  {
    echo "============================================================"
    echo "$1"
    echo "============================================================"
  } >> "$OUT"
}

run () {
  echo "\$ $*" >> "$OUT"
  eval "$@" >> "$OUT" 2>&1
  echo >> "$OUT"
  echo >> "$OUT"
}

# 1. Successful create: 201 + Location + ETag -------------------------------
section "1. Successful create -> 201 Created, with Location and ETag"
run curl -v http://localhost:8081/orders \
  -H '"Content-Type: application/json"' \
  -H '"Authorization: '"$AUTH"'"' \
  -H '"Idempotency-Key: create-key-1"' \
  -d "'{\"studentId\":101,\"itemId\":5,\"qty\":2,\"paymentMethodId\":\"tok_good\"}'"

# capture the id/etag we just created for later steps
CREATE_JSON=$(curl -s http://localhost:8081/orders \
  -H "Content-Type: application/json" -H "Authorization: $AUTH" \
  -H "Idempotency-Key: create-key-2" \
  -d '{"studentId":202,"itemId":9,"qty":1,"paymentMethodId":"tok_good"}')
ORDER_ID=$(node -e "console.log(JSON.parse(process.argv[1]).id)" "$CREATE_JSON")
ETAG=$(curl -sI http://localhost:8081/orders/$ORDER_ID -H "Authorization: $AUTH" | grep -i '^etag' | tr -d '\r' | sed 's/^[Ee][Tt]ag: //')

# 2. Idempotent repeat -------------------------------------------------------
section "2. Same Idempotency-Key repeated -> 200 OK, original order returned (no duplicate charge)"
run curl -v http://localhost:8081/orders \
  -H '"Content-Type: application/json"' \
  -H '"Authorization: '"$AUTH"'"' \
  -H '"Idempotency-Key: create-key-1"' \
  -d "'{\"studentId\":101,\"itemId\":5,\"qty\":2,\"paymentMethodId\":\"tok_good\"}'"

# 3. Conditional GET -> 304 --------------------------------------------------
section "3. Conditional GET with a matching If-None-Match -> 304 Not Modified, no body"
run curl -v "http://localhost:8081/orders/$ORDER_ID" \
  -H '"Authorization: '"$AUTH"'"' \
  -H "'If-None-Match: $ETAG'"

# 4. Conditional write rejected -> 412 --------------------------------------
section "4. Conditional write (PATCH) with a stale If-Match -> 412 Precondition Failed"
run curl -v "http://localhost:8081/orders/$ORDER_ID" \
  -X PATCH \
  -H '"Content-Type: application/json"' \
  -H '"Authorization: '"$AUTH"'"' \
  -H '"If-Match: \"stale-etag-value\""' \
  -d "'{\"qty\":9}'"

section "4b. Conditional write with the current If-Match -> 200 OK, ETag rotates"
run curl -v "http://localhost:8081/orders/$ORDER_ID" \
  -X PATCH \
  -H '"Content-Type: application/json"' \
  -H '"Authorization: '"$AUTH"'"' \
  -H "'If-Match: $ETAG'" \
  -d "'{\"qty\":4}'"

# 5. 400 malformed --------------------------------------------------------
section "5. Malformed create body -> 400 Bad Request"
run curl -v http://localhost:8081/orders \
  -H '"Content-Type: application/json"' \
  -H '"Authorization: '"$AUTH"'"' \
  -d "'{\"studentId\":\"not_an_int\"}'"

# 6. 404 missing ------------------------------------------------------------
section "6. Unknown order id -> 404 Not Found"
run curl -v http://localhost:8081/orders/999999 \
  -H '"Authorization: '"$AUTH"'"'

# 7. 401 missing auth ---------------------------------------------------
section "7. Missing Authorization header -> 401 Unauthorized"
run curl -v "http://localhost:8081/orders/$ORDER_ID"

# Bonus: OPTIONS discovery ---------------------------------------------------
section "8. OPTIONS discovery -> 204 No Content with Allow header"
run curl -v -X OPTIONS "http://localhost:8081/orders/$ORDER_ID"

# Bonus: 409 state conflict on double-cancel --------------------------------
section "9. Cancel then cancel again -> 202 Accepted, then 409 Conflict"
run curl -v -X POST "http://localhost:8081/orders/$ORDER_ID/cancel" \
  -H '"Authorization: '"$AUTH"'"'
run curl -v -X POST "http://localhost:8081/orders/$ORDER_ID/cancel" \
  -H '"Authorization: '"$AUTH"'"'

kill $BANK_PID $APP_PID 2>/dev/null
wait 2>/dev/null || true
echo "Transcript written to $OUT"
