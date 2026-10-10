class Order {
    constructor(id, studentId, itemId, qty, paymentMethodId, status, idempotencyKey = null) {
        this.id = id;
        this.studentId = studentId;
        this.itemId = itemId;
        this.qty = qty;
        this.paymentMethodId = paymentMethodId;
        this.status = status;
        this.idempotencyKey = idempotencyKey;
        this.createdAt = new Date().toISOString();
        this.updatedAt = this.createdAt;
    }

    asJson() {
        return {
            id: this.id,
            studentId: this.studentId,
            itemId: this.itemId,
            qty: this.qty,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
module.exports = Order;
