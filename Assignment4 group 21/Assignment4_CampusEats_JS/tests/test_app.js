const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../app');
const { createServer } = require('node:http');

let server, base;
function request(path, options = {}) {
  return fetch(base + path, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
}

test.before(async () => {
  server = createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const order = { userId: 1, items: [{ menuItemId: 10, quantity: 2 }], total: 120 };

test('create succeeds with 201 and Location', async () => {
  const r = await request('/orders', { method: 'POST', headers: { 'Idempotency-Key': 'test-key-1', 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
  assert.equal(r.status, 201);
  assert.ok(r.headers.get('location'));
});

test('idempotent repeat returns original result', async () => {
  const a = await request('/orders', { method: 'POST', headers: { 'Idempotency-Key': 'test-key-2' }, body: JSON.stringify(order) });
  const b = await request('/orders', { method: 'POST', headers: { 'Idempotency-Key': 'test-key-2' }, body: JSON.stringify(order) });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.deepEqual(await a.json(), await b.json());
});

test('malformed body returns 400', async () => {
  const r = await request('/orders', { method: 'POST', body: JSON.stringify({ userId: -1 }) });
  assert.equal(r.status, 400);
  const body = await r.json();
  assert.equal(body.status, 400);
});

test('unknown id returns 404', async () => {
  const r = await request('/orders/999999', { method: 'GET' });
  assert.equal(r.status, 404);
  const body = await r.json();
  assert.equal(body.status, 404);
});
