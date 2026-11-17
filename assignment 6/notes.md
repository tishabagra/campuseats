# CampusEats Assignment 6 — Notes

## Team Information

**Team ID:** 21

| Member | Roll No | Name |
|---|---|---|
| Member 1 | 20251651097 | Tisha Bagra |
| Member 2 | 20251651045 | Ishu Rajput |
| Member 3 | 20251651051 | Komal |
| Member 4 | 20251651103 | Vinita Rathore |
| Member 5 | 20251651080 | Rupini C Bhojannavar |

---

## Answers to Assignment Questions

### 1. Status Map

| Endpoint | Success Status | Real Failure Scenarios & Statuses |
|---|---|---|
| `POST /orders` | **201 Created** (`Location: /orders/{id}`) | `422 Unprocessable Content` (validation-failed, item-unavailable, empty-cart)<br>`429 Too Many Requests` (rate limit)<br>`503 Service Unavailable` (payment service down) |
| `GET /orders/{id}` | **200 OK** | `404 Not Found` (order-not-found)<br>`406 Not Acceptable` (unsupported Accept header) |
| `PATCH /orders/{id}` | **200 OK** | `404 Not Found` (order-not-found)<br>`409 Conflict` (illegal-transition) |
| `DELETE /orders/{id}` | **204 No Content** | `401 Unauthorized` (missing/invalid token)<br>`404 Not Found` (order-not-found)<br>`409 Conflict` (illegal-transition) |

---

### 2. Type Catalogue

| Stable Type Code | HTTP Status | Triggering Scenario |
|---|---|---|
| `validation-failed` | 422 | Missing required fields or incorrect data types in request body. |
| `empty-cart` | 422 | Order submitted with `items: []`. |
| `item-unavailable` | 422 | Item is sold out or unavailable for ordering. |
| `payment-declined` | 422 | Payment provider rejects transaction due to non-retryable error. |
| `order-not-found` | 404 | Target order ID does not exist in store. |
| `illegal-transition` | 409 | Attempting state changes on completed/delivered/deleted orders. |
| `rate-limit-exceeded`| 429 | Exceeded maximum allowed request budget per minute. |
| `not-acceptable` | 406 | Client Accept header asks for an unsupported media type. |
| `internal-error` | 500 | Unhandled server error or exception. |

---

### 3. Labeled Problem Details Body

```json
{
  "type": "item-unavailable",             // Stable Machine-readable error code string
  "title": "That item is sold out",       // Short, human-readable summary
  "status": 422,                          // HTTP status code matching response status line
  "detail": "Paneer Roll is unavailable"  // Specific detailed explanation for the error
}

### 4. Field-Level Validation 422 (Two Bad Fields) 
JSON
{
  "type": "validation-failed",
  "title": "Validation failed",
  "status": 422,
  "detail": "The request body contained invalid or missing fields.",
  "errors": [
    {
      "field": "address",
      "msg": "required"
    },
    {
      "field": "items[0].quantity",
      "msg": "must be an integer >= 1"
    }
  ]
}
### 5. Safe Retries and Status Codes
Safe to Retry:

429 Too Many Requests: Safe to retry after the duration specified in the Retry-After header.

503 Service Unavailable: Transient dependency/network failure; safe to retry after honoring Retry-After.

GET /orders/{id}: Naturally safe and idempotent read-only request that can be retried immediately.

Unsafe to Retry (Without modifying request):

400 Bad Request, 404 Not Found, 409 Conflict, 422 Unprocessable Content: Permanent client-side contract or domain failures that will yield the exact same error response if retried unchanged.

### 6. Internal Error Mapping & Information Masking
Internal errors in endpoints are caught in a try/catch wrapper:

JavaScript
try {
  // Domain / store operations
} catch (err) {
  console.error('[Internal Error]:', err); // Log full stack trace server-side
  return problem(res, 500, 'internal-error', 'Internal server error', 'An unexpected error occurred while processing your request.');
}
Hidden from Caller:  internal file system paths, database query messages, network IP addresses, and proprietary dependency details.

### 7. Content Negotiation Demonstration
Request with Accept: application/json
    GET /orders/1 HTTP/1.1
    Accept: application/json

Response:
    HTTP/1.1 200 OK
    Content-Type: application/json; charset=utf-8

    {"id":1,"userId":1,"address":"Hostel A","items":[{"menuItemId":10,"quantity":2}],"total":120,"status":"PENDING"}


Request with Accept: application/xml
    GET /orders/1 HTTP/1.1
    Accept: application/xml


Response:
    HTTP/1.1 200 OK
    Content-Type: application/xml; charset=utf-8
    <?xml version="1.0" encoding="UTF-8"?>
    <order><id>1</id><userId>1</userId><address>Hostel A</address><items>[{"menuItemId":10,"quantity":2}]</items><total>120</   total><status>PENDING</status></order>