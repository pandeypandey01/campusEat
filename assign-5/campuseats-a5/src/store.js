const Order = require('./models');

const _orders = new Map();
const _byKey = new Map();        // create Idempotency-Key -> order id
const _cancelByKey = new Map();  // cancel Idempotency-Key -> order id
let _nextId = 1;

function create(studentId, itemId, qty, paymentMethodId, status, key = null) {
    const o = new Order(_nextId, studentId, itemId, qty, paymentMethodId, status, key);
    _orders.set(o.id, o);
    if (key) _byKey.set(key, o.id);
    _nextId++;
    return o;
}

function find(oid) { return _orders.get(oid) || null; }

function findByKey(key) {
    const id = _byKey.get(key);
    return id ? _orders.get(id) : null;
}

function findCancelByKey(key) {
    const id = _cancelByKey.get(key);
    return id ? _orders.get(id) : null;
}

function rememberCancelKey(key, order) {
    if (key) _cancelByKey.set(key, order.id);
}

function findByStudent(studentId, { status, sort, limit, offset } = {}) {
    let results = Array.from(_orders.values()).filter(o => o.studentId === studentId);

    if (status) results = results.filter(o => o.status === status);

    if (sort === 'createdAt' || sort === '-createdAt') {
        results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        if (sort === '-createdAt') results.reverse();
    }

    const start = offset || 0;
    const end = limit ? start + limit : undefined;
    return results.slice(start, end);
}

// For tests
function _reset() { _orders.clear(); _byKey.clear(); _cancelByKey.clear(); _nextId = 1; }

module.exports = {
    create, find, findByKey, findByStudent,
    findCancelByKey, rememberCancelKey,
    _reset, _nextId
};
