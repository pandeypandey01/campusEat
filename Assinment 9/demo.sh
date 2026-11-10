#!/usr/bin/env bash
# Runs the five cases from Task 6. Start the server first (npm start).
URL=${URL:-http://localhost:3000}

echo "=== 1. No token -> 401 ==="
curl -i -s $URL/items | head -n 1; echo

echo "=== 2. Login as customer (alice) -> token ==="
CUST=$(curl -s -X POST $URL/login -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"alice123"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
echo "$CUST"; echo

echo "=== 3. GET /items with token -> 200 ==="
curl -i -s $URL/items -H "Authorization: Bearer $CUST" ; echo; echo

echo "=== 4. Restaurant (bob) POST /items -> 201 ==="
REST=$(curl -s -X POST $URL/login -H 'Content-Type: application/json' \
  -d '{"username":"bob","password":"bob123"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
curl -i -s -X POST $URL/items -H "Authorization: Bearer $REST" \
  -H 'Content-Type: application/json' -d '{"name":"Pasta","price":180}'; echo; echo

echo "=== 5. Customer (alice) POST /items -> 403 ==="
curl -i -s -X POST $URL/items -H "Authorization: Bearer $CUST" \
  -H 'Content-Type: application/json' -d '{"name":"Hack","price":1}'; echo
