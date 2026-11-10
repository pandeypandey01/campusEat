# CS543 · Assignment 09 — Securing the API

Catalogue REST service (`GET /items`, `POST /items`) secured with **bcrypt**, **JWT**, an
`auth` middleware and a `requireRole` middleware.

## Team
| Roll No. | Name |
|----------|------|
|20251651068|Paras Pandey|
|20251651067|Pankaj Singh|
|20251651069|Pranav|
|20251651049|Jayesh|
|20251651082|Shivam|

## Setup
```bash
npm install
cp .env.example .env        # then set JWT_SECRET to a long random value
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # generate a secret
npm start                   # http://localhost:3000
```

## Seeded users
| username | password | role |
|----------|----------|------------|
| alice | alice123 | customer |
| bob | bob123 | restaurant |

(Passwords are stored only as bcrypt hashes in `server.js`.)

## Demo
Run `./demo.sh` (or the curl commands below) while the server is running.

```bash
# 1. No token -> 401
curl -i http://localhost:3000/items

# 2. Login -> token
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"alice123"}'

# 3. With token -> 200
curl -i http://localhost:3000/items -H "Authorization: Bearer <TOKEN>"

# 4. Restaurant creates item -> 201
curl -i -X POST http://localhost:3000/items -H "Authorization: Bearer <RESTAURANT_TOKEN>" \
  -H "Content-Type: application/json" -d '{"name":"Pasta","price":180}'

# 5. Customer tries to create item -> 403
curl -i -X POST http://localhost:3000/items -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -H "Content-Type: application/json" -d '{"name":"Hack","price":1}'
```

Demo video + screenshots (401 / login / 200 / 201 / 403): **<https://drive.google.com/drive/folders/1olI2ebH5AkOIL5TeCTfrsjLIbNYgEum4?usp=sharing>**

---

## Answers

### 1. Which routes need only authentication, and which also need a role?

| Method + Path | Requirement | Roles allowed |
|---------------|-------------|---------------|
| `POST /login` | none (public) | — |
| `GET /items` | authentication only | any logged-in user (customer, restaurant, admin) |
| `GET /items/:id` | authentication only | any logged-in user |
| `POST /items` | authentication **+** role | `restaurant`, `admin` |

### 2. One 401 and one 403 from the demo

- **401** — `GET /items` with no `Authorization` header → `{"error":"token missing"}`.
  The server doesn't know *who* the caller is (no valid identity), so it is "unauthenticated"
  (401), not "forbidden" (403).
- **403** — `POST /items` as `alice` (customer) → `{"error":"forbidden"}`.
  The token is valid, so the server knows who she is (not 401), but her role `customer` is
  not allowed to change data.

### 3. JWT payload, trusting the role, and the secret

- **Payload:** `{ "id": <user id>, "role": "<role>", "iat": <issued-at>, "exp": <expiry> }`.
  No password or hash is ever put in the token.
- **Why the role claim is trustworthy:** a JWT is signed (HMAC-SHA256) with the server's
  secret. Any change to the payload (e.g. editing `customer` to `restaurant`) breaks the
  signature, so `jwt.verify` rejects it. Only the server, which holds the secret, can
  produce a valid token. (The payload is only base64-encoded, not encrypted — it is
  tamper-proof, not secret.)
- **Why the secret stays out of the code:** whoever knows the secret can forge a valid token
  with any id or role, e.g. making themselves `admin`. Code gets committed to GitHub and
  shared, so the secret is read from `process.env.JWT_SECRET` (a git-ignored `.env`), and only
  a blank `.env.example` is committed. It can then be changed per environment and rotated
  without touching the code.
