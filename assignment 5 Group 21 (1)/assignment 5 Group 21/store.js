const { Order } = require('./models');

const orders = new Map();
const idempotency = new Map();
let nextId = 1;

function createOrder(data, key) {
  if (key && idempotency.has(key)) return { order: idempotency.get(key), repeated: true };
  const id = nextId++;
  const order = new Order({ ...data, id, internalId: `ORD-${id}`, idempotencyKey: key || null });
  orders.set(id, order);
  if (key) idempotency.set(key, order);
  return { order, repeated: false };
}

function rollbackOrder(order) {
  orders.delete(order.id);
  if (order.idempotencyKey) idempotency.delete(order.idempotencyKey);
}

function getOrder(id) { return orders.get(Number(id)); }
function listOrders({ status, userId, sort = 'id', page = 1, limit = 20 } = {}) {
  let result = [...orders.values()];
  if (status) result = result.filter(o => o.status === status);
  if (userId !== undefined) result = result.filter(o => o.userId === Number(userId));
  result.sort((a, b) => {
    if (sort === 'total') return a.total - b.total;
    if (sort === '-total') return b.total - a.total;
    if (sort === 'id') return a.id - b.id;
    if (sort === '-id') return b.id - a.id;
    return a.id - b.id;
  });
  const start = (page - 1) * limit;
  return result.slice(start, start + limit);
}

function cancelOrder(id) {
  const order = getOrder(id);
  if (!order) return null;
  if (order.status !== 'PENDING') return { conflict: true, order };
  order.status = 'CANCELLED';
  return { conflict: false, order };
}

function deleteOrder(id) {
  const order = getOrder(id);
  if (!order) return null;
  if (order.status === 'PAID') return { conflict: true, order };
  orders.delete(order.id);
  if (order.idempotencyKey) idempotency.delete(order.idempotencyKey);
  return { conflict: false, order };
}

module.exports = { createOrder, rollbackOrder, getOrder, listOrders, cancelOrder, deleteOrder };
