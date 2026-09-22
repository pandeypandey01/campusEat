const { problem } = require('./errors');

// B1: every body we send is application/json. If the client's Accept header
// can't possibly match that (e.g. "Accept: application/xml"), refuse with
// 406 rather than silently sending JSON anyway.
function negotiateJson(req, res, next) {
    const accept = req.headers['accept'];
    if (!accept) return next(); // no preference stated -> fine

    const accepts = accept.split(',').map(s => s.trim().toLowerCase());
    const ok = accepts.some(a =>
        a.startsWith('*/*') || a.startsWith('application/*') || a.startsWith('application/json')
    );

    if (!ok) return problem(res, 406, "not-acceptable", `This API only serves application/json, got: ${accept}`);
    return next();
}

module.exports = { negotiateJson };
