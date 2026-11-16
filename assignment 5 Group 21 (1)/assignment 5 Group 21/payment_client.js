const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function callPayment(order, idempotencyKey) {
  if (!PAYMENT_URL) throw new Error('PAYMENT_SERVICE_URL is not configured');

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      const response = await fetch(PAYMENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ orderId: order.id, amount: order.total }),
        signal: controller.signal
      });
      if (response.status >= 400 && response.status < 500) {
        const err = new Error(`Payment rejected with ${response.status}`);
        err.nonRetryable = true;
        throw err;
      }
      if (response.ok) return await response.json();
      throw new Error(`Payment service returned ${response.status}`);
    } catch (err) {
      if (err.nonRetryable || attempt === maxAttempts - 1) throw err;
      const backoff = Math.min(1000 * (2 ** attempt), 4000);
      const jitter = Math.floor(Math.random() * 250);
      await sleep(backoff + jitter);
    } finally {
      clearTimeout(timer);
    }
  }
}
module.exports = { callPayment };
