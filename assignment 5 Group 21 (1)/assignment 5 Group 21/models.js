class Order {
  constructor({ id, userId, items, total, status = 'PENDING', paymentId = null, internalId = null, idempotencyKey = null }) {
    this.internalId = internalId || id;
    this.id = id;
    this.userId = userId;
    this.items = items;
    this.total = total;
    this.status = status;
    this.paymentId = paymentId;
    this.idempotencyKey = idempotencyKey;
  }

  asJson() {
    return {
      id: this.id,
      userId: this.userId,
      items: this.items,
      total: this.total,
      status: this.status,
      paymentId: this.paymentId
    };
  }
}

module.exports = { Order };
