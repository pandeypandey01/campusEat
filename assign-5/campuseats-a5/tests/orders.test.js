const request = require('supertest');
const app = require('../src/app');
const store = require('../src/store');
const rateLimitModule = require('../src/rateLimit');
const paymentsClient = require('../src/paymentsClient');

jest.mock('../src/paymentsClient');

const AUTH = { Authorization: 'Bearer test-token' };
const BODY = { studentId: 101, itemId: 5, qty: 2, paymentMethodId: 'tok_good' };

beforeEach(() => {
    store._reset();
    rateLimitModule._reset();
    jest.clearAllMocks();
    paymentsClient.chargeWithRetry.mockResolvedValue({ status: 'captured' });
});

// ---- A1/existing behavior, still green -----------------------------------

test('create order returns 201 with Location and ETag', async () => {
    const res = await request(app).post('/orders').set(AUTH).send(BODY);
    expect(res.statusCode).toBe(201);
    expect(res.headers['location']).toBe(`/orders/${res.body.id}`);
    expect(res.headers['etag']).toBeDefined();
});

test('same idempotency key returns original 200, no duplicate order', async () => {
    const headers = { ...AUTH, 'Idempotency-Key': 'k-99' };
    const res1 = await request(app).post('/orders').set(headers).send(BODY);
    const res2 = await request(app).post('/orders').set(headers).send(BODY);
    expect(res1.statusCode).toBe(201);
    expect(res2.statusCode).toBe(200);
    expect(res1.body.id).toBe(res2.body.id);
    expect(paymentsClient.chargeWithRetry).toHaveBeenCalledTimes(1);
});

test('malformed body is rejected with 400', async () => {
    const res = await request(app).post('/orders').set(AUTH).send({ studentId: 'not_an_int' });
    expect(res.statusCode).toBe(400);
});

test('unknown order id returns 404', async () => {
    const res = await request(app).get('/orders/999').set(AUTH);
    expect(res.statusCode).toBe(404);
});

// ---- B3: auth ---------------------------------------------------------

test('missing bearer token returns 401', async () => {
    const res = await request(app).get('/orders/1');
    expect(res.statusCode).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer');
});

test('empty bearer token returns 401', async () => {
    const res = await request(app).get('/orders/1').set('Authorization', 'Bearer ');
    expect(res.statusCode).toBe(401);
});

// ---- B1: content negotiation -------------------------------------------

test('unsupported Accept header returns 406', async () => {
    const res = await request(app).get('/orders/1').set(AUTH).set('Accept', 'application/xml');
    expect(res.statusCode).toBe(406);
});

// ---- A5: OPTIONS + Allow -------------------------------------------------

test('OPTIONS /orders/:id returns Allow header', async () => {
    const res = await request(app).options('/orders/1');
    expect(res.statusCode).toBe(204);
    expect(res.headers['allow']).toBe('GET, PATCH, OPTIONS');
});

// ---- C1: conditional GET -> 304 ------------------------------------------

test('If-None-Match with current ETag returns 304 with empty body', async () => {
    const create = await request(app).post('/orders').set(AUTH).send(BODY);
    const id = create.body.id;
    const etag = create.headers['etag'];

    const res = await request(app).get(`/orders/${id}`).set(AUTH).set('If-None-Match', etag);
    expect(res.statusCode).toBe(304);
    expect(res.text).toBe('');
});

test('If-None-Match with stale ETag returns 200 with body', async () => {
    const create = await request(app).post('/orders').set(AUTH).send(BODY);
    const id = create.body.id;

    const res = await request(app).get(`/orders/${id}`).set(AUTH).set('If-None-Match', '"stale-value"');
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(id);
});

// ---- C2: conditional write -> 412 -----------------------------------------

test('PATCH without If-Match is rejected with 400', async () => {
    const create = await request(app).post('/orders').set(AUTH).send(BODY);
    const res = await request(app).patch(`/orders/${create.body.id}`).set(AUTH).send({ qty: 3 });
    expect(res.statusCode).toBe(400);
});

test('PATCH with stale If-Match returns 412 and does not modify the order', async () => {
    const create = await request(app).post('/orders').set(AUTH).send(BODY);
    const id = create.body.id;

    const res = await request(app)
        .patch(`/orders/${id}`)
        .set(AUTH)
        .set('If-Match', '"stale-value"')
        .send({ qty: 5 });
    expect(res.statusCode).toBe(412);

    const check = await request(app).get(`/orders/${id}`).set(AUTH);
    expect(check.body.qty).toBe(2); // unchanged
});

test('PATCH with fresh If-Match succeeds and rotates the ETag', async () => {
    const create = await request(app).post('/orders').set(AUTH).send(BODY);
    const id = create.body.id;
    const etag = create.headers['etag'];

    const res = await request(app)
        .patch(`/orders/${id}`)
        .set(AUTH)
        .set('If-Match', etag)
        .send({ qty: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.qty).toBe(5);
    expect(res.headers['etag']).not.toBe(etag);
});

test('X-HTTP-Method-Override: PATCH via POST behaves like a real PATCH', async () => {
    const create = await request(app).post('/orders').set(AUTH).send(BODY);
    const id = create.body.id;
    const etag = create.headers['etag'];

    const res = await request(app)
        .post(`/orders/${id}`)
        .set(AUTH)
        .set('If-Match', etag)
        .set('X-HTTP-Method-Override', 'PATCH')
        .send({ qty: 7 });
    expect(res.statusCode).toBe(200);
    expect(res.body.qty).toBe(7);
});

// ---- cancel: state conflict + idempotency-key retry-safety ---------------

test('cancelling twice without a key returns 409 the second time', async () => {
    const create = await request(app).post('/orders').set(AUTH).send(BODY);
    const id = create.body.id;

    const first = await request(app).post(`/orders/${id}/cancel`).set(AUTH);
    const second = await request(app).post(`/orders/${id}/cancel`).set(AUTH);
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(409);
});

test('cancelling twice with the same Idempotency-Key returns the original result both times', async () => {
    const create = await request(app).post('/orders').set(AUTH).send(BODY);
    const id = create.body.id;
    const headers = { ...AUTH, 'Idempotency-Key': 'cancel-key-1' };

    const first = await request(app).post(`/orders/${id}/cancel`).set(headers);
    const second = await request(app).post(`/orders/${id}/cancel`).set(headers);
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(200);
    expect(second.body.status).toBe('cancelled');
});

// ---- B5: rate limiting -----------------------------------------------

test('exceeding the per-client budget returns 429 with Retry-After', async () => {
    const limit = rateLimitModule.LIMIT;
    let last;
    for (let i = 0; i < limit + 1; i++) {
        last = await request(app).get('/orders/1').set(AUTH);
    }
    expect(last.statusCode).toBe(429);
    expect(last.headers['retry-after']).toBeDefined();
});

// ---- B6: CORS preflight -----------------------------------------------

test('CORS preflight OPTIONS is answered without auth', async () => {
    const res = await request(app)
        .options('/orders')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST');
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
});

// ---- B7: security headers -----------------------------------------------

test('responses carry security headers and hide the framework', async () => {
    const res = await request(app).get('/orders/999').set(AUTH);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
});
