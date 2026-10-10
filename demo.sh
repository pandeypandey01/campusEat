#!/bin/bash
# Usage: DEMO=1 RATE_LIMIT=8 node server.js &   then   ./demo.sh > transcript.txt
H=http://localhost:3000
run() { echo; echo "\$ $*"; "$@" 2>/dev/null; echo; }
echo "=== D1: SUCCESS PATH ==="
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -H 'Idempotency-Key: k-100' -d '{"items":[{"sku":"burger","qty":2}],"address":"Hostel B, Room 214"}'
echo "--- idempotent replay (same key, same body): same 201, same id, Idempotency-Replayed: true"
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -H 'Idempotency-Key: k-100' -d '{"items":[{"sku":"burger","qty":2}],"address":"Hostel B, Room 214"}'
run curl -i $H/orders/1
run curl -i -X PATCH $H/orders/1 -H 'Content-Type: application/json' -d '{"status":"preparing"}'
echo "=== D2: FAILURE PATHS ==="
echo "--- empty cart"
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -d '{"items":[],"address":"Hostel B"}'
echo "--- qty <= 0 AND missing address (two bad fields at once)"
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -d '{"items":[{"sku":"burger","qty":0}]}'
echo "--- qty not an integer + empty sku + no address (three)"
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -d '{"items":[{"sku":"","qty":1.5}]}'
echo "--- item unavailable"
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -d '{"items":[{"sku":"sold-out-wrap","qty":1}],"address":"Library"}'
echo "--- payment declined"
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -d '{"items":[{"sku":"fries","qty":1}],"address":"Library","payment":"declined"}'
echo "--- unknown id"
run curl -i $H/orders/999
echo "--- illegal transition (preparing -> placed... then collected skipping ready)"
run curl -i -X PATCH $H/orders/1 -H 'Content-Type: application/json' -d '{"status":"collected"}'
echo "--- illegal cancel (order 1 is already preparing)"
run curl -i -X DELETE $H/orders/1
echo "--- malformed JSON"
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -d '{"items": [oops'
echo "--- idempotency key reused with different body"
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -H 'Idempotency-Key: k-100' -d '{"items":[{"sku":"fries","qty":9}],"address":"Elsewhere"}'
echo "--- B4: internal error (simulated DB failure) -> clean 500, no stack/DB text"
run curl -i -X POST $H/orders -H 'X-Demo-Fault: db' -H 'Content-Type: application/json' -d '{"items":[{"sku":"fries","qty":1}],"address":"Library"}'
echo "--- transient: 503 + Retry-After"
run curl -i -X POST $H/orders -H 'X-Demo-Fault: busy' -H 'Content-Type: application/json' -d '{"items":[{"sku":"fries","qty":1}],"address":"Library"}'
echo "--- rate limit: burst of POSTs until 429 + Retry-After"
for i in 1 2 3 4 5 6 7 8; do curl -s -o /dev/null -w "request $i -> %{http_code}\n" -X POST $H/orders -H 'Content-Type: application/json' -d '{"items":[{"sku":"fries","qty":1}],"address":"Burst"}'; done
run curl -i -X POST $H/orders -H 'Content-Type: application/json' -d '{"items":[{"sku":"fries","qty":1}],"address":"Burst"}'
echo "=== D3: CONTENT NEGOTIATION ==="
run curl -i $H/orders/1 -H 'Accept: application/json'
run curl -i $H/orders/1 -H 'Accept: application/xml'
run curl -i $H/orders/1 -H 'Accept: text/csv'
echo "=== D4: NO REGRESSIONS (idempotency) ==="
echo "--- orders created for key k-100 (must be exactly 1 with address 'Hostel B, Room 214')"
curl -s $H/orders | python3 -c "import sys,json; d=json.load(sys.stdin); print(len([o for o in d if o['address']=='Hostel B, Room 214']), 'order(s) for key k-100')"
