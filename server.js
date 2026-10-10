// Campus Eat - Orders service (A6: honest responses, errors & validation)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const DEMO = process.env.DEMO === '1';               // enables X-Demo-Fault header for the transcript
const RATE_LIMIT = +process.env.RATE_LIMIT || 10;    // POST /orders per window per client
const RATE_WINDOW_MS = 10000;
const REQUEST_TIMEOUT_MS = 5000;
const BASE = 'https://campuseat.example/problems/';

// ---------- data ----------
const menu = { burger: { stock: 20 }, fries: { stock: 50 }, 'masala-chai': { stock: 30 }, 'sold-out-wrap': { stock: 0 } };
const orders = new Map();
const idemStore = new Map();   // Idempotency-Key -> { fingerprint, status, headers, body }
const hits = new Map();        // client -> [timestamps]
let nextId = 1;

const TRANSITIONS = { placed: ['preparing', 'cancelled'], preparing: ['ready'], ready: ['collected'], collected: [], cancelled: [] };

// ---------- B1: single error helper ----------
// type / title / status / detail (+ optional errors[], instance)
function problem(res, status, slug, title, detail, extra = {}) {
  const body = { type: BASE + slug, title, status, detail, ...extra };
  res.status(status);
  if (extra.retryAfter) { res.set('Retry-After', String(extra.retryAfter)); delete body.retryAfter; }
  res.set('Content-Type', 'application/problem+json; charset=utf-8');   // C4
  return res.send(JSON.stringify(body));
}

// ---------- C3: content negotiation ----------
function xmlEscape(s) { return String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])); }
function toXml(name, v) {
  if (Array.isArray(v)) return v.map(x => toXml('item', x)).join('');
  if (v && typeof v === 'object') return `<${name}>${Object.entries(v).map(([k, x]) => toXml(k, x)).join('')}</${name}>`;
  return `<${name}>${xmlEscape(v)}</${name}>`;
}
// returns 'json' | 'xml' | null (null => 406)
function negotiate(req) { return req.headers.accept ? req.accepts(['json', 'xml']) || null : 'json'; }
function sendOrder(req, res, status, order) {
  const t = negotiate(req);
  if (t === 'xml') return res.status(status).type('application/xml; charset=utf-8').send('<?xml version="1.0" encoding="utf-8"?>' + toXml('order', order));
  return res.status(status).type('application/json; charset=utf-8').send(JSON.stringify(order));
}
function requireAcceptable(req, res, next) {
  if (!negotiate(req))
    return problem(res, 406, 'not-acceptable', 'Not Acceptable',
      `Cannot produce '${req.headers.accept}'. Supported: application/json, application/xml.`);
  next();
}

// ---------- middleware ----------
app.use((req, res, next) => {            // timeout -> 503 + Retry-After (transient)
  const t = setTimeout(() => { if (!res.headersSent) problem(res, 503, 'service-unavailable', 'Service Unavailable', 'Request timed out; please retry.', { retryAfter: 2 }); }, REQUEST_TIMEOUT_MS);
  res.on('finish', () => clearTimeout(t)); res.on('close', () => clearTimeout(t));
  next();
});
app.use(express.json({ type: ['application/json', 'application/*+json'] }));

// ---------- C1/C2: validation (collect ALL errors) ----------
function validateOrder(b) {
  const errors = [];
  if (b === null || typeof b !== 'object' || Array.isArray(b)) return [{ field: 'body', message: 'must be a JSON object' }];
  if (!Array.isArray(b.items)) errors.push({ field: 'items', message: 'is required and must be an array' });
  else if (b.items.length === 0) errors.push({ field: 'items', message: 'must contain at least one item' });
  else b.items.forEach((it, i) => {
    if (!it || typeof it !== 'object') return errors.push({ field: `items[${i}]`, message: 'must be an object' });
    if (typeof it.sku !== 'string' || !it.sku) errors.push({ field: `items[${i}].sku`, message: 'is required and must be a non-empty string' });
    if (!Number.isInteger(it.qty) || it.qty < 1) errors.push({ field: `items[${i}].qty`, message: 'must be an integer >= 1' });
  });
  if (typeof b.address !== 'string' || !b.address.trim()) errors.push({ field: 'address', message: 'is required and must be a non-empty string' });
  return errors;
}

// ---------- rate limit ----------
function rateLimit(req, res, next) {
  const k = req.ip, now = Date.now();
  const arr = (hits.get(k) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    const wait = Math.ceil((RATE_WINDOW_MS - (now - arr[0])) / 1000);
    return problem(res, 429, 'rate-limited', 'Too Many Requests', `Limit is ${RATE_LIMIT} orders per ${RATE_WINDOW_MS / 1000}s.`, { retryAfter: wait });
  }
  arr.push(now); hits.set(k, arr); next();
}

// demo fault injection (B4 / 503 proof) - only when DEMO=1
function demoFault(req, res, next) {
  if (!DEMO) return next();
  const f = req.headers['x-demo-fault'];
  if (f === 'busy') return problem(res, 503, 'service-unavailable', 'Service Unavailable', 'Kitchen system is busy. Retry shortly.', { retryAfter: 3 });
  if (f === 'db') { try { throw new Error('SQLITE_ERROR: no such table: orders at /srv/app/db.js:42'); } catch (e) { return next(e); } }
  next();
}

// ---------- routes ----------
// POST /orders
app.post('/orders', demoFault, requireAcceptable, rateLimit, (req, res) => {
  // idempotency (A5)
  const key = req.headers['idempotency-key'];
  const fp = JSON.stringify(req.body);
  if (key && idemStore.has(key)) {
    const saved = idemStore.get(key);
    if (saved.fingerprint !== fp)
      return problem(res, 422, 'idempotency-key-reuse', 'Idempotency Key Reused', 'This Idempotency-Key was already used with a different body.');
    res.set(saved.headers).set('Idempotency-Replayed', 'true');
    return res.status(saved.status).send(saved.body);
  }

  // C2: validate first, collect everything, then act
  const errors = validateOrder(req.body);
  if (errors.length) {
    const empty = req.body && Array.isArray(req.body.items) && req.body.items.length === 0;
    return problem(res, 422, empty ? 'empty-cart' : 'validation-failed',
      empty ? 'Cart Is Empty' : 'Validation Failed',
      empty ? 'An order needs at least one item.' : `${errors.length} field(s) failed validation.`, { errors });
  }
  // business rules
  for (const it of req.body.items) {
    const m = menu[it.sku];
    if (!m) return problem(res, 422, 'validation-failed', 'Validation Failed', 'Unknown item.', { errors: [{ field: 'items.sku', message: `unknown sku '${it.sku}'` }] });
    if (m.stock < it.qty) return problem(res, 409, 'item-unavailable', 'Item Unavailable', `'${it.sku}' has ${m.stock} left; requested ${it.qty}.`);
  }
  if (req.body.payment === 'declined') return problem(res, 402, 'payment-declined', 'Payment Declined', 'The payment method was declined.');

  req.body.items.forEach(it => { menu[it.sku].stock -= it.qty; });
  const id = String(nextId++);
  const order = { id, items: req.body.items, address: req.body.address, status: 'placed', createdAt: new Date().toISOString() };
  orders.set(id, order);

  const t = negotiate(req);
  const payload = t === 'xml' ? '<?xml version="1.0" encoding="utf-8"?>' + toXml('order', order) : JSON.stringify(order);
  const headers = { Location: `/orders/${id}`, 'Content-Type': (t === 'xml' ? 'application/xml' : 'application/json') + '; charset=utf-8' };
  if (key) idemStore.set(key, { fingerprint: fp, status: 201, headers, body: payload });
  res.set(headers).status(201).send(payload);
});

// GET /orders
app.get('/orders', requireAcceptable, (req, res) => {
  const list = [...orders.values()];
  if (negotiate(req) === 'xml') return res.type('application/xml; charset=utf-8').send('<?xml version="1.0" encoding="utf-8"?>' + toXml('orders', list));
  res.type('application/json; charset=utf-8').send(JSON.stringify(list));
});

// GET /orders/:id
app.get('/orders/:id', requireAcceptable, (req, res) => {
  const o = orders.get(req.params.id);
  if (!o) return problem(res, 404, 'order-not-found', 'Order Not Found', `No order with id '${req.params.id}'.`);
  sendOrder(req, res, 200, o);
});

// PATCH /orders/:id  { "status": "preparing" }
app.patch('/orders/:id', requireAcceptable, (req, res) => {
  const o = orders.get(req.params.id);
  if (!o) return problem(res, 404, 'order-not-found', 'Order Not Found', `No order with id '${req.params.id}'.`);
  const s = req.body && req.body.status;
  if (!Object.keys(TRANSITIONS).includes(s))
    return problem(res, 422, 'validation-failed', 'Validation Failed', '1 field(s) failed validation.', { errors: [{ field: 'status', message: `must be one of ${Object.keys(TRANSITIONS).join(', ')}` }] });
  if (!TRANSITIONS[o.status].includes(s))
    return problem(res, 409, 'illegal-transition', 'Illegal Transition', `Cannot move order from '${o.status}' to '${s}'.`);
  o.status = s;
  sendOrder(req, res, 200, o);
});

// DELETE /orders/:id  (cancel; only while 'placed')
app.delete('/orders/:id', (req, res) => {
  const o = orders.get(req.params.id);
  if (!o) return problem(res, 404, 'order-not-found', 'Order Not Found', `No order with id '${req.params.id}'.`);
  if (!TRANSITIONS[o.status].includes('cancelled'))
    return problem(res, 409, 'illegal-transition', 'Illegal Transition', `Cannot cancel an order that is '${o.status}'.`);
  o.items.forEach(it => { menu[it.sku].stock += it.qty; });
  orders.delete(o.id);
  res.status(204).end();
});

// ---------- B4: catch-alls ----------
app.use((req, res) => problem(res, 404, 'not-found', 'Not Found', `No route for ${req.method} ${req.path}.`));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return problem(res, 400, 'malformed-json', 'Malformed JSON', 'Request body is not valid JSON.');
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}:`, err.stack || err);   // detail stays server-side
  problem(res, 500, 'internal-error', 'Internal Server Error', 'Something went wrong on our side. Please try again later.');
});

if (require.main === module) app.listen(PORT, () => console.log(`Campus Eat Orders on :${PORT}`));
module.exports = app;
