# CampusEats Assignment 4 - JavaScript

Orders REST service implemented with Node.js and Express.

## Run

```bash
npm install
```

Start the mock payment service in one terminal:

```bash
node mock_payment.js
```

In another terminal:

```bash
set PAYMENT_SERVICE_URL=http://localhost:4000/payments
npm start
```

For PowerShell:

```powershell
$env:PAYMENT_SERVICE_URL="http://localhost:4000/payments"
npm start
```

## Test

```bash
npm test
```

## Files

- `openapi.yaml` - REST contract
- `app.js` - Express API and validation
- `models.js` - stored record + public representation
- `store.js` - in-process storage
- `errors.js` - common problem shape
- `payment_client.js` - hardened outbound Payments call
- `tests/test_app.js` - four required tests
- `NOTES.md` - assignment answers and reasoning
- `mock_payment.js` - local Payments service for testing
