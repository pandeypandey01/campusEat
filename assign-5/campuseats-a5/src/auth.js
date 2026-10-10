const { problem } = require('./errors');

// B3: protected endpoints require Authorization: Bearer <token>.
// A missing or empty token -> 401. This is header handling only;
// any non-empty bearer token is accepted (no real token/user system).
function requireAuth(req, res, next) {
    const header = req.headers['authorization'] || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match ? match[1].trim() : '';

    if (!token) {
        res.setHeader('WWW-Authenticate', 'Bearer');
        return problem(res, 401, "unauthorized", "Authorization: Bearer <token> is required");
    }

    req.clientId = token; // used by the rate limiter to key per-client, not per-IP
    return next();
}

module.exports = { requireAuth };
