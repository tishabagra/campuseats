const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../app');
const { createServer } = require('node:http');

let server, base;
function request(path, options = {}) {
  return fetch(base + path, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) },
    ...options
  });
}

const order = { userId: 1, items: [{ menuItemId: 10, quantity: 2 }], total: 120 };

test.before(async () => {
  server = createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test('create succeeds with 201, Location and JSON', async () => {
  const r = await request('/orders', { method: 'POST', headers: { 'Idempotency-Key': 'test-key-1' }, body: JSON.stringify(order) });
  assert.equal(r.status, 201);
  assert.ok(r.headers.get('location'));
  assert.equal(r.headers.get('content-type').split(';')[0], 'application/json');
});

test('same idempotency key returns original result', async () => {
  const a = await request('/orders', { method: 'POST', headers: { 'Idempotency-Key': 'test-key-2' }, body: JSON.stringify(order) });
  const b = await request('/orders', { method: 'POST', headers: { 'Idempotency-Key': 'test-key-2' }, body: JSON.stringify(order) });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.deepEqual(await a.json(), await b.json());
});

test('single item GET returns ETag and conditional GET returns 304', async () => {
  const created = await request('/orders', { method: 'POST', headers: { 'Idempotency-Key': 'test-key-3' }, body: JSON.stringify(order) });
  const location = created.headers.get('location');
  const first = await request(location, { method: 'GET' });
  assert.equal(first.status, 200);
  const tag = first.headers.get('etag');
  assert.ok(tag);
  const second = await request(location, { method: 'GET', headers: { 'If-None-Match': tag } });
  assert.equal(second.status, 304);
});

test('conditional cancellation with stale ETag returns 412', async () => {
  const created = await request('/orders', { method: 'POST', headers: { 'Idempotency-Key': 'test-key-4' }, body: JSON.stringify(order) });
  const location = created.headers.get('location');
  const first = await request(location, { method: 'GET' });
  const r = await request(`${location}/cancellation`, { method: 'POST', headers: { Authorization: 'Bearer demo-token', 'If-Match': '"stale"' }, body: JSON.stringify({ reason: 'test' }) });
  assert.equal(r.status, 412);
});

test('malformed body returns 400', async () => {
  const r = await request('/orders', { method: 'POST', body: JSON.stringify({ userId: -1 }) });
  assert.equal(r.status, 400);
});

test('unknown id returns 404', async () => {
  const r = await request('/orders/999999', { method: 'GET' });
  assert.equal(r.status, 404);
});

test('protected endpoint without token returns 401', async () => {
  const r = await request('/orders/1/cancellation', { method: 'POST', headers: { 'If-Match': '"anything"' }, body: '{}' });
  assert.equal(r.status, 401);
});

test('unsupported Accept returns 406', async () => {
  const r = await request('/orders', { method: 'GET', headers: { Accept: 'text/xml' } });
  assert.equal(r.status, 406);
});

test('OPTIONS returns Allow and CORS headers', async () => {
  const r = await request('/orders/1', { method: 'OPTIONS' });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('allow'), 'GET, DELETE, OPTIONS');
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
});
