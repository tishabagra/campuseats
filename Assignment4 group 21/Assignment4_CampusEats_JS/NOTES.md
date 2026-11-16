# Assignment 4 — CampusEats Orders REST Service

## Part A — Model the service

### A1. Picked service
**Orders**. Assignment 2 gives Orders ownership of `ORDERS` and `ORDER ITEMS`. The Orders service owns placing, reading, filtering and cancelling orders. Payments remains a separate service.

### A2. SOAP-style starting operations from Assignment 2
1. `add_to_cart(user_id, item_id, quantity)`
2. `place_order(user_id, cart, address_id, payment_method)`
3. `get_order(order_id)`
4. `cancel_order(order_id)`
5. `list_orders(user_id, status)`

### A3. Durable nouns
- `add_to_cart` → cart/items
- `place_order` → orders
- `get_order` → orders
- `cancel_order` → orders/cancellation
- `list_orders` → orders

For this assignment the implementation focuses on the durable **orders** resource; cart management is outside the four required endpoints.

### A4. Resource table

| Method | URL | What it does | Success code | Failure codes |
|---|---|---|---|---|
| POST | `/orders` | Creates an order after charging the payment service | 201 | 400, 422, 503 |
| GET | `/orders/{orderId}` | Reads one order | 200 | 404 |
| GET | `/orders?userId=1&status=placed` | Filters orders by user/status | 200 | 400 |
| POST | `/orders/{orderId}/cancellation` | Changes an order to cancelled | 200 | 404, 409 |

### A5. Hard choice
`cancel_order(order_id)` did not fit comfortably as a verb in a REST URL. I rejected `/cancelOrder` because it exposes the SOAP operation name rather than a resource. I also rejected `POST /orders/{id}/cancel` because “cancel” is still being treated as an RPC action. I represented the durable state transition as the `cancellation` sub-resource: `/orders/{orderId}/cancellation`.

## Part B — OpenAPI

`openapi.yaml` was written before the handler implementation. The four endpoints above are all present in the contract. Request/response models are defined once under `components.schemas` and reused with `$ref`. Every operation documents its failure responses.

Validation command used in this submission:

```text
$ python validate_openapi.py
OpenAPI validation: 0 errors
Contract structure, references, responses and parameters: PASS
```

The environment used to prepare this submission did not have `openapi-spec-validator` installed and had no network access for installing it, so the included validator performs a local structural OpenAPI check. For the final lab machine, also run `openapi-spec-validator openapi.yaml` or paste the file into editor.swagger.io and capture the zero-error result.

## Part C — Implementation

Files follow the requested shape: `models.py`, `store.py`, `errors.py`, `app.py`, plus `tests/`.

`Order` stores internal fields such as `payment_transaction_id` and `idempotency_key`, but `as_json()` publishes `orderTime` and does not expose those internal fields. Thus the stored record and public representation are intentionally different.

`validate_order_body()` in `app.py` performs the request-body validation before any body fields are used by the order logic. Without it, a request such as `{ "userId": 1 }` could reach code that expects `addressId`, `items`, and `amount`, causing an invalid request to become a server-side error instead of a clean 400.

All failures use the same shape from `problem()`:

```json
{
  "type": "https://campuseats.example/problems/order",
  "title": "...",
  "status": 400,
  "detail": "..."
}
```

`POST /orders` is the idempotent endpoint. The `Idempotency-Key` is stored with the created order. Repeating the same key returns the original order and `Location` without charging again or creating another order.

## Part D — Network hardening

`payment_client.py` reads `PAYMENT_SERVICE_URL` from the environment. It never hard-codes the payment endpoint. The outbound charge uses a 2-second timeout, retries at most twice after the first attempt, and adds exponential backoff plus random jitter.

A 4xx payment response is never retried. A retried charge always carries the same `Idempotency-Key`, so a payment provider can deduplicate the operation.

### D3. Fallback
If Payments is unreachable after the retries, the Orders service returns **503** and does not create an order. Degrading to a locally “placed” order would be unsafe because the student could receive an order confirmation even though payment was not confirmed. Failing closed preserves the correctness of the order/payment boundary.

## Comparison with Assignment 3

Assignment 3 used a SOAP/WSDL contract for a **Payments** integration. The WSDL described a single `charge` operation, SOAP messages, a document/literal binding, SOAPAction and a service endpoint. Assignment 4 instead models the **Orders** service as resources and HTTP methods, with JSON schemas, HTTP status codes and a reusable problem response.

The Assignment 2 service design says Orders owns order data, while Payments is separate. The new REST implementation keeps that boundary: the Orders service owns the in-process order store and calls Payments through an HTTP client rather than importing a Payments store.

## Answers to the five required questions

### 1. WSDL line count vs OpenAPI line count

The Assignment 3 `partner.wsdl` supplied in the group repository is **106 lines**. This Assignment 4 `openapi.yaml` is **170 lines**. The difference is **64 lines**.

The extra OpenAPI lines are mostly resource paths, HTTP operations, query/path/header parameters, HTTP status responses, JSON request/response schemas, reusable error definitions, and REST-oriented documentation. The WSDL also contains protocol-specific machinery that the OpenAPI contract does not need.

Two examples of things the WSDL declared that OpenAPI does not need in this form are:
1. the explicit SOAP **binding/transport and SOAPAction** declaration; and
2. the separate WSDL **message/part wrappers** (`chargeRequest`, `chargeResponse`, and their `wsdl:part` elements).

### 2. SOAP Fault replacement

Assignment 3 contains this fault:

```xml
<soap:Fault>
    <faultcode>soap:Client</faultcode>
    <faultstring>Card Declined</faultstring>
    <detail>
        <error code="card_declined"/>
    </detail>
</soap:Fault>
```

The REST replacement is:

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "type": "https://campuseats.example/problems/order",
  "title": "Payment rejected",
  "status": 422,
  "detail": "Card declined"
}
```

Returning the error inside a `200 OK` is a problem because HTTP intermediaries, clients, monitoring systems, caches and retry logic can interpret the request as successful. The transport status would say “success” while the application body says “failure”, making generic network infrastructure unable to handle the failure correctly.

### 3. UDDI: publish, find, bind

The three UDDI moves do not all survive as UDDI operations. **Publish** and **find** still exist conceptually: the OpenAPI document is published/distributed, and developers or tooling find the service through its documented server URL or service catalogue. **Bind** also still exists conceptually, but it is no longer a UDDI binding step; the HTTP client binds by using the URL and HTTP method defined by OpenAPI.

The job is taken over by the **OpenAPI contract plus normal HTTP service discovery/configuration**. In this implementation the runtime payment address is supplied by `PAYMENT_SERVICE_URL`, so deployment configuration supplies the actual endpoint.

### 4. XML Schema vs code validation

The specific function that now carries the XML-Schema-like request validation responsibility is **`validate_order_body()` in `app.py`**.

Without it, a body such as `{ "userId": 1 }` could pass into application logic even though it has no `addressId`, `items`, or `amount`. That would turn a client validation problem into an uncontrolled server error instead of the required 400 response.

### 5. Where SOAP would still be preferable

I would still choose the SOAP stack for the **external PayEdge payment charge integration** from Assignment 3 when the partner requires SOAP. The guarantee I am buying is the partner's formal **WSDL/XSD contract plus SOAP message-level security/fault model**: the request shape and typed fields are contractually defined, and credentials can be carried in a signed/encrypted SOAP header rather than depending only on transport-level TLS.

For ordinary CampusEats resources such as Orders, REST is a better fit because the domain is naturally resource-oriented and HTTP already gives us status codes, caching semantics and straightforward clients.

## JavaScript Implementation Note
This version implements the same Assignment 4 design in JavaScript using Node.js and Express. Request validation is performed by the `validate()` function in `app.js`. The outbound Payments call is implemented in `payment_client.js` using the `PAYMENT_SERVICE_URL` environment variable, a timeout, exponential backoff, jitter, and an Idempotency-Key. Tests use Node's built-in `node:test` runner.
