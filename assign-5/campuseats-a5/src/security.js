// B7: general security headers. Date is already added automatically by
// Node's http server on every response, so it needs no code here. Express
// does not send a "Server" header by default (see NOTES.md B7) -- we go a
// step further and disable X-Powered-By too, since advertising the exact
// framework only helps an attacker fingerprint the service.
function securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Only meaningful over HTTPS; harmless to send in dev, required in prod.
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    next();
}

module.exports = { securityHeaders };
