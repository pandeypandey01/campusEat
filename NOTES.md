# CS543 · Assignment 6 — Campus Eat Orders (honest responses)
Team: 24
< Pranav Bhawsar 	20251651069
  Jayesh Badole	    20251651049
  Shivam Kumar	    20251651082
  Pankaj Singh	    20251651067
  Paras Pandey	    20251651068 >

Run: `npm i && DEMO=1 RATE_LIMIT=12 node server.js`, then `./demo.sh > transcript.txt`.
(`DEMO=1` only enables the `X-Demo-Fault` header used to prove 500/503 handling.)

## 1. Status map
| Endpoint | Success | Failures (and why) |
|---|---|---|
| POST /orders | **201** + Location (a resource was created) | 400 body isn't JSON · 402 payment declined · 406 can't produce requested format · 409 item out of stock (conflicts with current state) · 422 body well-formed but invalid / empty cart / key reuse · 429 too many requests · 500 our bug · 503 temporarily unavailable/timeout |
| GET /orders | **200** | 406 |
| GET /orders/{id} | **200** | 404 no such order · 406 |
| PATCH /orders/{id} | **200** (updated order returned) | 404 · 409 transition not allowed from current status · 422 `status` missing/not a known value |
| DELETE /orders/{id} | **204** (no body) | 404 · 409 only `placed` orders can be cancelled |

A2: no handler returns 200 for a failure; every failure goes through `problem()`.

## 2. Type catalogue (prefix `https://campuseat.example/problems/`)
| slug | status | trigger |
|---|---|---|
| empty-cart | 422 | `items` is `[]` |
| validation-failed | 422 | any bad field (qty not int ≥1, missing sku/address, unknown sku, bad PATCH status) |
| item-unavailable | 409 | requested qty > stock |
| payment-declined | 402 | payment method declined |
| order-not-found | 404 | unknown order id |
| illegal-transition | 409 | PATCH/DELETE not allowed from current status |
| idempotency-key-reuse | 422 | same Idempotency-Key, different body |
| malformed-json | 400 | unparseable body |
| not-acceptable | 406 | Accept is neither JSON nor XML |
| rate-limited | 429 | over the POST /orders limit (+ Retry-After) |
| service-unavailable | 503 | timeout / dependency busy (+ Retry-After) |
| internal-error | 500 | any unexpected exception |
| not-found | 404 | no such route |

## 3. Problem Details body
```json
{"type":"https://campuseat.example/problems/order-not-found",
 "title":"Order Not Found","status":404,
 "detail":"No order with id '999'."}
```
- `type` – stable URI identifying the *kind* of error (clients switch on this)
- `title` – short human summary, same for every instance of the type
- `status` – the HTTP status, repeated in the body
- `detail` – explanation of *this* occurrence
- `errors[]` – extension member, only on 422 (see Q4). Content-Type: `application/problem+json; charset=utf-8`.

## 4. Field-level 422 (two bad fields at once)
Request: `{"items":[{"sku":"burger","qty":0}]}`
```json
{"type":".../validation-failed","title":"Validation Failed","status":422,
 "detail":"2 field(s) failed validation.",
 "errors":[{"field":"items[0].qty","message":"must be an integer >= 1"},
           {"field":"address","message":"is required and must be a non-empty string"}]}
```
`validateOrder()` runs before any stock/payment work and collects every error.

## 5. Retry safety
- **Safe to retry:** GET and DELETE (idempotent), PATCH to the same target status, and POST /orders **only with the same `Idempotency-Key`** (replay returns the same 201 with `Idempotency-Replayed: true`, no duplicate order).
- **Which codes say "retry":** only transient ones — **429** and **503**, both with `Retry-After`. A 500 may be retried with backoff (with an idempotency key for POST).
- **Never retry unchanged:** 400, 402, 404, 406, 409, 422 — resending the same request gets the same answer; fix the request (or state) first.

## 6. Internal error → clean error
The global error handler (`app.use((err,req,res,next)…)`) catches anything thrown, e.g. the simulated `SQLITE_ERROR: no such table: orders at /srv/app/db.js:42`. The full message and stack are logged server-side (`server.log`); the client only gets a 500 `internal-error` with a generic detail. Hidden: the DB error text, table names, file paths, stack trace, framework info. Malformed JSON (parser exception) is mapped to a clean 400 `malformed-json` the same way.

## 7. JSON vs XML
- `Accept: application/json` → `{"id":"1","items":[{"sku":"burger","qty":2}],"address":"Hostel B, Room 214","status":"preparing",...}`
- `Accept: application/xml` → `<?xml version="1.0" encoding="utf-8"?><order><id>1</id><item><sku>burger</sku>...</order>` (Content-Type `application/xml; charset=utf-8`)
- `Accept: text/csv` → 406 `not-acceptable`. No Accept header → JSON.
Errors are always `application/problem+json`.

## D4 regressions
Idempotency replay still returns the original order (transcript: "1 order(s) for key k-100"); same key + different body → 422; a 5s request timeout returns 503 + Retry-After.
