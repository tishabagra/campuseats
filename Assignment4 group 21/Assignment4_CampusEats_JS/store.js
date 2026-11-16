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
function getOrder(id) { return orders.get(Number(id)); }
function listOrders(status) {
  return [...orders.values()].filter(o => !status || o.status === status);
}
function cancelOrder(id) {
  const order = getOrder(id);
  if (!order) return null;
  if (order.status === 'CANCELLED') return { conflict: true, order };
  if (order.status !== 'PENDING') return { conflict: true, order };
  order.status = 'CANCELLED';
  return { conflict: false, order };
}
module.exports = { createOrder, getOrder, listOrders, cancelOrder };
