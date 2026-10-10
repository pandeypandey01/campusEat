const TITLES = {
    "invalid-request": "Invalid request",
    "payment-declined": "Payment declined",
    "order-not-found": "Order not found",
    "state-conflict": "Cannot cancel order",
    "payments-unavailable": "Payments service unreachable",
    "unauthorized": "Missing or invalid bearer token",
    "not-acceptable": "Unsupported Accept type",
    "precondition-failed": "Resource has changed",
    "rate-limited": "Too many requests",
    "not-modifiable": "Order can no longer be modified"
};

function problem(res, statusCode, code, detail = "", errors = null) {
    const body = { type: `/errors/${code}`, title: TITLES[code], status: statusCode, detail: detail };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
}

module.exports = { problem, TITLES };
