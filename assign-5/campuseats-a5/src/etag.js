const crypto = require('crypto');

// A strong ETag over the resource's current JSON representation.
// Because it is derived from studentId/itemId/qty/status/updatedAt, it
// changes on every state-changing write (PATCH, cancel) and stays stable
// across reads -- which is what lets us use it for If-None-Match (C1)
// and If-Match (C2).
function etagFor(order) {
    const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(order.asJson()))
        .digest('hex');
    return `"${hash}"`;
}

module.exports = { etagFor };
