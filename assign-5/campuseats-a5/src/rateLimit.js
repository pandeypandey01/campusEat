const { problem } = require('./errors');

const WINDOW_MS = 60 * 1000; // 1 minute window
const LIMIT = 20;            // requests per client per window (kept low so it's easy to demo)

const buckets = new Map(); // clientId -> { count, windowStart }

// B5: rate limits are per client (Authorization token / clientId), never global.
// Every response gets X-RateLimit-Limit and X-RateLimit-Remaining; a client that
// exceeds its budget gets 429 + Retry-After (seconds until the window resets).
function rateLimit(req, res, next) {
    const clientId = req.clientId || req.ip || 'anonymous';
    const now = Date.now();

    let bucket = buckets.get(clientId);
    if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
        bucket = { count: 0, windowStart: now };
        buckets.set(clientId, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, LIMIT - bucket.count);
    const resetSeconds = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);

    res.setHeader('X-RateLimit-Limit', String(LIMIT));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (bucket.count > LIMIT) {
        res.setHeader('Retry-After', String(resetSeconds));
        return problem(res, 429, "rate-limited", `Limit of ${LIMIT} requests/minute exceeded for this client`);
    }

    return next();
}

function _reset() { buckets.clear(); }

module.exports = { rateLimit, _reset, LIMIT, WINDOW_MS };
