const express = require('express');
const compression = require('compression');

const store = require('./store');
const paymentsClient = require('./paymentsClient');
const { problem } = require('./errors');
const { requireAuth } = require('./auth');
const { rateLimit } = require('./rateLimit');
const { cors } = require('./cors');
const { securityHeaders } = require('./security');
const { negotiateJson } = require('./negotiate');
const { etagFor } = require('./etag');

const app = express();
app.disable('x-powered-by'); // B7 - don't advertise the framework

app.use(compression());      // B1 - gzip Content-Encoding for large JSON bodies
app.use(express.json());
app.use(cors);                // B6
app.use(securityHeaders);     // B7

// ---------------------------------------------------------------------------
// A5: OPTIONS + Allow, and X-HTTP-Method-Override as a documented fallback
// ---------------------------------------------------------------------------

app.options('/orders', (req, res) => {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(204).end();
});

app.options('/orders/:id', (req, res) => {
    res.setHeader('Allow', 'GET, PATCH, OPTIONS');
    return res.status(204).end();
});

app.options('/orders/:id/cancel', (req, res) => {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateCreate(body) {
    const errors = [];
    if (!Number.isInteger(body.studentId)) errors.push(["studentId", "required integer"]);
    if (!Number.isInteger(body.itemId)) errors.push(["itemId", "required integer"]);
    if (!Number.isInteger(body.qty) || body.qty <= 0) errors.push(["qty", "positive integer"]);
    if (!body.paymentMethodId) errors.push(["paymentMethodId", "required"]);
    return errors;
}

// ---------------------------------------------------------------------------
// POST /orders -- create (unsafe, made idempotent via Idempotency-Key)
// ---------------------------------------------------------------------------

app.post('/orders', requireAuth, rateLimit, negotiateJson, async (req, res) => {
    const errs = validateCreate(req.body);
    if (errs.length > 0) return problem(res, 400, "invalid-request", "", errs);

    const key = req.headers['idempotency-key'];
    if (key) {
        const prior = store.findByKey(key);
        if (prior) {
            res.setHeader('ETag', etagFor(prior));
            return res.status(200).json(prior.asJson());
        }
    }

    const tempId = store._nextId || Math.floor(Math.random() * 1000);
    const cost = req.body.qty * 1000;

    try {
        await paymentsClient.chargeWithRetry(tempId, req.body.paymentMethodId, cost);
    } catch (error) {
        if (error.name === 'CardDeclined') return problem(res, 422, "payment-declined", error.message);
        return problem(res, 503, "payments-unavailable", error.message);
    }

    const o = store.create(req.body.studentId, req.body.itemId, req.body.qty, req.body.paymentMethodId, "placed", key);
    res.setHeader('Location', `/orders/${o.id}`);
    res.setHeader('ETag', etagFor(o));
    return res.status(201).json(o.asJson());
});

// ---------------------------------------------------------------------------
// GET /orders/:id -- safe, idempotent read. ETag + Cache-Control + If-None-Match
// ---------------------------------------------------------------------------

app.get('/orders/:id', requireAuth, rateLimit, negotiateJson, (req, res) => {
    const o = store.find(parseInt(req.params.id));
    if (!o) return problem(res, 404, "order-not-found", `No order ${req.params.id}`);

    const etag = etagFor(o);
    res.setHeader('ETag', etag);
    // Private: this is one student's order, not something a shared/CDN cache
    // should serve to a different client. must-revalidate forces the ETag
    // check above rather than trusting a stale local copy past its freshness.
    res.setHeader('Cache-Control', 'private, max-age=30, must-revalidate');

    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch.split(',').map(s => s.trim()).includes(etag)) {
        return res.status(304).end(); // C1 -- no body
    }

    return res.status(200).json(o.asJson());
});

// ---------------------------------------------------------------------------
// GET /orders -- safe, idempotent list. Filter / sort / paginate via query string
// ---------------------------------------------------------------------------

app.get('/orders', requireAuth, rateLimit, negotiateJson, (req, res) => {
    const student = parseInt(req.query.student);
    if (!Number.isInteger(student)) {
        return problem(res, 400, "invalid-request", "", [["student", "required integer query param"]]);
    }

    const status = req.query.status || undefined;
    const sort = req.query.sort || undefined;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset) : undefined;

    const items = store.findByStudent(student, { status, sort, limit, offset });
    // No Cache-Control here on purpose: a filtered/paginated collection view
    // changes too often (new orders, cancellations) to be worth caching, and
    // giving it a shared cache header risks one student's page being served
    // to another. no-store keeps every list read a live read.
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(items.map(o => o.asJson()));
});

// ---------------------------------------------------------------------------
// PATCH /orders/:id -- unsafe write, made retry-safe with If-Match (C2)
// ---------------------------------------------------------------------------

function patchOrderHandler(req, res) {
    const o = store.find(parseInt(req.params.id));
    if (!o) return problem(res, 404, "order-not-found", `No order ${req.params.id}`);

    const ifMatch = req.headers['if-match'];
    if (!ifMatch) {
        return problem(res, 400, "invalid-request", "If-Match header is required for PATCH", [["If-Match", "required header"]]);
    }

    const currentEtag = etagFor(o);
    if (ifMatch !== currentEtag && ifMatch !== '*') {
        // C2: someone else already changed this order since the client last
        // read it -- refuse rather than silently clobbering their edit.
        return problem(res, 412, "precondition-failed",
            `If-Match ${ifMatch} does not match current ETag ${currentEtag}`);
    }

    if (o.status !== 'placed') {
        return problem(res, 409, "not-modifiable", `Order is ${o.status} and can no longer be edited`);
    }

    const errors = [];
    if (req.body.qty !== undefined && (!Number.isInteger(req.body.qty) || req.body.qty <= 0)) {
        errors.push(["qty", "positive integer"]);
    }
    if (errors.length > 0) return problem(res, 400, "invalid-request", "", errors);

    if (req.body.qty !== undefined) o.qty = req.body.qty;
    o.updatedAt = new Date().toISOString();

    const newEtag = etagFor(o);
    res.setHeader('ETag', newEtag);
    return res.status(200).json(o.asJson());
}

app.patch('/orders/:id', requireAuth, rateLimit, negotiateJson, patchOrderHandler);

// A constrained client that cannot send PATCH may instead send
//   POST /orders/:id  with  X-HTTP-Method-Override: PATCH
// This is a documented fallback ONLY -- it is not a general tunnel: it
// recognizes PATCH alone and reuses the exact same handler and precondition
// checks as the real PATCH route, it does not bypass them.
app.post('/orders/:id', requireAuth, rateLimit, negotiateJson, (req, res) => {
    const override = (req.headers['x-http-method-override'] || '').toUpperCase();
    if (override === 'PATCH') return patchOrderHandler(req, res);
    return problem(res, 405, "invalid-request",
        "POST /orders/:id is only valid with X-HTTP-Method-Override: PATCH");
});

// ---------------------------------------------------------------------------
// POST /orders/:id/cancel -- non-CRUD action as a sub-resource (A2).
// Naturally neither safe nor idempotent (2nd call = 409); made retry-safe
// with an optional Idempotency-Key, same pattern as create.
// ---------------------------------------------------------------------------

app.post('/orders/:id/cancel', requireAuth, rateLimit, negotiateJson, (req, res) => {
    const o = store.find(parseInt(req.params.id));
    if (!o) return problem(res, 404, "order-not-found");

    const key = req.headers['idempotency-key'];
    if (key) {
        const prior = store.findCancelByKey(key);
        if (prior) return res.status(200).json({ id: prior.id, status: prior.status });
    }

    if (o.status !== "placed") return problem(res, 409, "state-conflict", `status is ${o.status}`);

    o.status = "cancelled";
    o.updatedAt = new Date().toISOString();
    store.rememberCancelKey(key, o);

    return res.status(202).json({ id: o.id, status: o.status });
});

module.exports = app;

if (require.main === module) {
    app.listen(8081, () => console.log('Orders running on 8081'));
}
