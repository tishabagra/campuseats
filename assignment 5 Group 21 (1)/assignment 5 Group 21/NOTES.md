# CampusEats Assignment 5 — HTTP Methods & Headers

## Team information

**Team ID:** 21

| Member | Roll No | Name |
|---|---|---|
| Member 1 | 20251651097 | Tisha Bagra |
| Member 2 | 20251651045 | Ishu Rajput |
| Member 3 | 20251651051 | Komal |
| Member 4 | 20251651103 | Vinita Rathore |
| Member 5 | 20251651080 | Rupini C Bhojannavar |

## A1 — CampusEats method map

| Action | Method | URL | Safe | Idempotent |
|---|---|---|---|---|
| Create order | POST | `/orders` | No | Yes when `Idempotency-Key` is reused |
| Read one order | GET | `/orders/{id}` | Yes | Yes |
| List/filter/sort/page orders | GET | `/orders?status=PENDING&userId=1&sort=-total&page=1&limit=20` | Yes | Yes |
| Cancel pending order | POST | `/orders/{id}/cancellation` | No | No by HTTP semantics; made retry-safe with `If-Match` and state checks |
| Delete unpaid order | DELETE | `/orders/{id}` | No | Yes: repeated deletion of an already missing resource has the same end state |
| Advertise methods | OPTIONS | `/orders` or `/orders/{id}` | Yes | Yes |

No action verb is embedded in a URL such as `/cancelOrder`. Cancellation is represented as the `cancellation` sub-resource.

## A2 — Non-CRUD action

Cancellation is a state-changing action, so it is `POST /orders/{id}/cancellation`. This avoids `POST /cancelOrder` and keeps the URL resource-oriented.

## A3 — Safe and idempotent

GET and OPTIONS are safe because they do not change order state. GET, OPTIONS and DELETE are idempotent in the HTTP sense. POST `/orders` is not naturally idempotent, but the service makes retries safe with `Idempotency-Key`. POST `/orders/{id}/cancellation` is neither safe nor naturally idempotent, so a stale-write check with `If-Match` prevents applying a cancellation to a resource version the client did not read.

No GET handler changes state.

## A4 — Query parameters

The collection GET uses `status`, `userId`, `sort`, `page` and `limit`. Example:

`GET /orders?status=PENDING&userId=1&sort=-total&page=1&limit=10`

It remains a pure read. POST would be justified for a complex search only when the filter cannot reasonably fit in a URL, for example a large structured search document or a sensitive query that should not be placed in the URL. Switching to POST gives up the normal safe/read semantics of GET and weakens generic caching/bookmarking/linkability.

## A5 — OPTIONS, Allow and method override

`OPTIONS /orders` returns `Allow: GET, POST, OPTIONS`.

`OPTIONS /orders/{id}` returns `Allow: GET, DELETE, OPTIONS`.

For constrained clients, `X-HTTP-Method-Override: DELETE` is accepted as a documented fallback for the DELETE operation. It is not used as the normal API contract.

## A6 — Full HTTP exchange

### Request

```http
POST /orders HTTP/1.1
Host: localhost:3000
Accept: application/json
Content-Type: application/json
Idempotency-Key: demo-create-001

{"userId":1,"items":[{"menuItemId":10,"quantity":2}],"total":120}
```

### Response

```http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /orders/1
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains

{"id":1,"userId":1,"items":[{"menuItemId":10,"quantity":2}],"total":120,"status":"PENDING","paymentId":"PAY-1"}
```

The request uses HTTP/1.1. Date and Server may also be supplied by the deployed server/framework; they are not application headers added by `app.js`.

# Part B — Headers

## B1–B7 header behavior

- JSON request/response bodies use `Content-Type: application/json`.
- `Accept: application/json` is supported. An unsupported media type such as `Accept: text/xml` returns 406.
- Large JSON compression is not enabled in this minimal Express build because the assignment says to enable it only if the framework setup allows it; production can add the standard compression middleware.
- Creates return 201 + `Location`.
- Reads return 200.
- Deletes return 204.
- Malformed requests return 400; missing resources 404; state conflicts 409; valid domain refusals 422.
- Protected cancellation/deletion requires `Authorization: Bearer <token>`; missing/empty tokens return 401.
- Single-item GET sends `Cache-Control` and `ETag`.
- Rate-limit headers are per client IP. Exceeding 100 requests/minute returns 429 with `Retry-After`.
- CORS sends `Access-Control-Allow-Origin: *` and handles OPTIONS preflight.
- `X-Content-Type-Options: nosniff` and HSTS are set on responses. HTTPS is required in production.

# Part C — Caching & safe retries

## C1 — Conditional GET

A successful `GET /orders/1` returns an ETag such as:

`ETag: "a1b2c3d4e5f60718"`

A later request:

```http
GET /orders/1 HTTP/1.1
Host: localhost:3000
Accept: application/json
If-None-Match: "a1b2c3d4e5f60718"
```

returns:

```http
HTTP/1.1 304 Not Modified
```

with no body. This saves the client from downloading unchanged JSON.

## C2 — Conditional write

Cancellation requires `If-Match`. If the client sends an old ETag, the service returns 412 instead of applying the change. This prevents an editor from changing an order version that has already changed.

## C3 — Idempotency key

`POST /orders` accepts `Idempotency-Key`. The key is stored with the original order. A repeat with the same key returns the original 201 response and does not create another order or charge the payment service again.

A duplicate order would cause real damage because it could create a second food order and a second payment charge.

## C4 — Safe-retry plan

| Risky endpoint | Mechanism | Why |
|---|---|---|
| POST `/orders` | `Idempotency-Key` | Prevents duplicate order/payment work on client retries. |
| GET `/orders/{id}` | `If-None-Match` | Safe conditional read; 304 avoids retransmitting unchanged data. |
| POST `/orders/{id}/cancellation` | `If-Match` | Prevents a stale client from overwriting a newer order state. |
| DELETE `/orders/{id}` | `If-Match` when supplied | Prevents deletion after the resource changed; repeated DELETE has the same final state. |

# D1 — curl -v transcript

See `curl-transcript.txt` for the captured exchange sequence. It includes the successful create, the same create repeated with the same Idempotency-Key, a conditional GET returning 304, a conditional cancellation rejected with 412, and 400/404/401 failures.

# D2 — Headers table

| Endpoint | Request headers needed | Response headers set/important |
|---|---|---|
| POST `/orders` | `Content-Type`, `Accept`, optional `Idempotency-Key` | `Location`, `Content-Type`, rate-limit headers, security/CORS headers |
| GET `/orders` | `Accept` | `Content-Type`, rate-limit headers, security/CORS headers |
| GET `/orders/{id}` | `Accept`, optional `If-None-Match` | `ETag`, `Cache-Control`, rate-limit headers, security/CORS headers |
| POST `/orders/{id}/cancellation` | `Authorization`, `If-Match`, optional `Content-Type`/`Accept` | `ETag`, `Content-Type`, rate-limit headers, security/CORS headers |
| DELETE `/orders/{id}` | `Authorization`, optional `If-Match` | 204, rate-limit headers, security/CORS headers |
| OPTIONS `/orders` | `Origin`, `Access-Control-Request-Method`, `Access-Control-Request-Headers` | `Allow`, `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers` |

# NOTES.md — Eight answers

## 1. Three endpoints: method, success status, most important response header

1. **POST `/orders` — 201 Created — `Location`**. It identifies the newly created order resource and lets the client follow the resource URL.
2. **GET `/orders/{id}` — 200 OK — `ETag`**. It gives the resource version used for conditional caching and safe writes.
3. **DELETE `/orders/{id}` — 204 No Content — `X-RateLimit-Remaining`**. It tells the client how much request budget remains after the operation; the 204 confirms deletion without sending a body.

## 2. Safe vs idempotent

Safe: GET and OPTIONS.

Idempotent: GET, OPTIONS and DELETE. POST `/orders` is made retry-safe with an Idempotency-Key. POST cancellation is not treated as naturally idempotent; `If-Match` makes stale retries fail safely instead of changing an unexpected version.

## 3. ETag, 304 and 412

Example ETag: `"a1b2c3d4e5f60718"`.

304 request:

```http
GET /orders/1 HTTP/1.1
Host: localhost:3000
If-None-Match: "a1b2c3d4e5f60718"
Accept: application/json
```

It saves an unnecessary response body when the resource has not changed.

412 write:

```http
POST /orders/1/cancellation HTTP/1.1
Host: localhost:3000
Authorization: Bearer demo-token
If-Match: "stale-etag"
Content-Type: application/json
Accept: application/json

{"reason":"changed my order"}
```

It prevents a stale editor from changing a newer resource version.

## 4. 422 vs 400

**400 example:**

```http
POST /orders HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Accept: application/json

{"userId":-1}
```

This is malformed for the API contract because required fields are missing and `userId` is invalid.

**422 example:**

```http
GET /orders?status=UNKNOWN HTTP/1.1
Host: localhost:3000
Accept: application/json
```

The request is syntactically valid, but the domain/API does not support the requested status value. The service therefore uses 422.

## 5. Browser CORS question

The browser enforced the same-origin policy and blocked JavaScript from reading the cross-origin response. The server can still log 200 because the HTTP request completed successfully. `Access-Control-Allow-Origin` tells the browser that the requesting origin is allowed to read the response; the OPTIONS preflight supplies the allowed methods and headers.

## 6. Cache-Control

A single-order GET uses:

`Cache-Control: public, max-age=30, must-revalidate`

because an unchanged order can be reused briefly and validated with its ETag.

A payment result, authorization response, or any response containing secrets should use `Cache-Control: no-store`. This service does not expose such a response directly, but the principle applies to protected sensitive data.

## 7. When POST is right for search

POST is appropriate for a search when the query is too large or structurally complex for a normal URL, such as a large JSON filter containing nested conditions. The trade-off is that POST is not a safe/read-only HTTP method, so generic caches, bookmarking and link sharing do not work with the same semantics as GET.

## 8. Meaning of Location

On **201 Created**, `Location` points to the newly created resource, for example `/orders/1`.

On a **3xx redirect**, `Location` points to the target URI the client should request next.
