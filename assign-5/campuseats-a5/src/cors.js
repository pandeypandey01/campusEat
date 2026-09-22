// B6: without Access-Control-Allow-Origin, the browser's own same-origin
// policy blocks the response in JS even though the server already replied
// 200 (see NOTES.md Q5). We allow any origin to read this API (it is not
// cookie-authenticated -- auth is a bearer token in a header the caller
// sets explicitly) and we answer the CORS preflight OPTIONS request.
function cors(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers',
        'Content-Type, Authorization, Idempotency-Key, If-Match, If-None-Match, X-HTTP-Method-Override');
    res.setHeader('Access-Control-Expose-Headers',
        'Location, ETag, X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After');

    if (req.method === 'OPTIONS' && req.headers['access-control-request-method']) {
        // This is a CORS preflight, not an app-level OPTIONS discovery call.
        return res.status(204).end();
    }
    return next();
}

module.exports = { cors };
