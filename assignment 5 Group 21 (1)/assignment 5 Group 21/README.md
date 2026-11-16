## Team information

**Team ID:** 21

| Member | Roll No | Name |
|---|---|---|
| Member 1 | 20251651097 | Tisha Bagra |
| Member 2 | 20251651045 | Ishu Rajput |
| Member 3 | 20251651051 | Komal |
| Member 4 | 20251651103 | Vinita Rathore |
| Member 5 | 20251651080 | Rupini C Bhojannavar |

# CampusEats Assignment 5 - JavaScript

Orders REST service extended for HTTP methods, headers, caching and safe retries.

## Run

```bash
npm install
node mock_payment.js
```

In another terminal:

```bash
set PAYMENT_SERVICE_URL=http://localhost:4000/payments
npm start
```

PowerShell:

```powershell
$env:PAYMENT_SERVICE_URL="http://localhost:4000/payments"
npm start
```

## Test

```bash
npm test
```

## Assignment 5 files

- `openapi.yaml` — methods, status codes, headers and parameters
- `app.js` — HTTP behavior, validation, CORS, rate limits, ETags, conditional requests and auth header handling
- `models.js` — order model
- `store.js` — in-process order store and idempotency records
- `errors.js` — common JSON problem shape
- `payment_client.js` — hardened outbound payment call with timeout/retry/idempotency key
- `tests/test_app.js` — automated checks
- `curl-transcript.txt` — captured curl-style exchange examples and failures
- `NOTES.md` — method map, headers table, safe-retry plan and eight answers
- `mock_payment.js` — local payment service
