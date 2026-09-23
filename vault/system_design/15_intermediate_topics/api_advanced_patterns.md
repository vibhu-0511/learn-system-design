#system-design #intermediate #api

# API Advanced Patterns — Beyond Basic REST

---

## API Versioning in Practice

### URL Path Versioning (Most Common)
```
/v1/users/123
/v2/users/123   → Different response format
```
**Pro:** Clear, easy to route. **Con:** URL pollution.

### Header Versioning
```
GET /users/123
Accept: application/vnd.myapi.v2+json
```
**Pro:** Clean URLs. **Con:** Less visible, harder to test.

### Sunset Strategy
```
V1 → Deprecated (return Sunset header with date)
V2 → Current
V3 → Beta

Response header: Sunset: Sat, 01 Jun 2025 00:00:00 GMT
```

---

## Pagination Deep Dive

### Offset-Based (Simple but Flawed)
```
GET /posts?page=5&limit=20  → OFFSET 80 LIMIT 20
```
**Problem:** Page 10,000 requires scanning 200,000 rows. New inserts shift pages.

### Cursor-Based (Production Standard)
```
GET /posts?after=eyJpZCI6MTIzfQ&limit=20
// Cursor = base64({ id: 123 }) — position of last item on previous page

SELECT * FROM posts WHERE id > 123 ORDER BY id LIMIT 20
```
**Pro:** Consistent results even with new inserts. Efficient (uses index). **Con:** Can't jump to page N.

### Keyset Pagination (Best for Sorted Data)
```
GET /posts?created_after=2024-01-15T10:00:00&limit=20

SELECT * FROM posts WHERE created_at > '2024-01-15T10:00:00' ORDER BY created_at LIMIT 20
```
**Requires:** Unique, sequential column (timestamp + id for ties).

---

## Idempotency in Practice

```java
// Client sends: POST /payments
// Header: Idempotency-Key: order_abc_123

@PostMapping("/payments")
public ResponseEntity<Payment> createPayment(
    @RequestHeader("Idempotency-Key") String idempotencyKey,
    @RequestBody PaymentRequest request) {

    // Check if already processed
    Optional<Payment> existing = idempotencyStore.get(idempotencyKey);
    if (existing.isPresent()) {
        return ResponseEntity.ok(existing.get());  // Return cached result
    }

    // Process payment
    Payment payment = paymentService.process(request);

    // Store result for 24 hours
    idempotencyStore.save(idempotencyKey, payment, Duration.ofHours(24));

    return ResponseEntity.status(201).body(payment);
}
```

**Rule:** Every non-idempotent operation (POST) should accept an idempotency key. Network retries MUST be safe.

---

## Error Response Standard (RFC 7807)

```json
{
  "type": "https://api.myapp.com/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 422,
  "detail": "Account balance (₹500) is less than transfer amount (₹1000)",
  "instance": "/transfers/txn_abc123",
  "balance": 500,
  "required": 1000
}
```

**Consistent error format** across all endpoints. Clients can parse programmatically.

---

## Rate Limit Headers

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100         → max requests per window
X-RateLimit-Remaining: 47      → requests left
X-RateLimit-Reset: 1705123456  → when window resets (Unix timestamp)

HTTP/1.1 429 Too Many Requests
Retry-After: 30                → seconds to wait before retrying
```

---

## Webhook Design

```
Your System → POST https://merchant.com/webhooks/payment
{
  "event": "payment.completed",
  "data": { "payment_id": "pay_123", "amount": 5000 },
  "timestamp": "2024-01-15T10:00:00Z",
  "signature": "sha256=abc123..."  // HMAC signature for verification
}

Delivery guarantees:
- Retry on 5xx or timeout: 1s, 5s, 30s, 5min, 1hr (exponential backoff)
- After 24 hours of failure: disable webhook, notify merchant
- Merchant must respond 2xx within 30 seconds
- Idempotency: include event_id, merchant must handle duplicates
```

---

## gRPC — When to Use Over REST

```protobuf
// user.proto
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (stream User);  // Server streaming
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);  // Bidirectional
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

| When to Use gRPC | When to Use REST |
|------------------|------------------|
| Internal service-to-service | External/public APIs |
| Need streaming | Browser clients (native support) |
| High throughput (binary protobuf) | Human-readable (JSON) |
| Strongly typed contracts | Flexible/evolving APIs |
| Low latency critical | Simplicity preferred |

## Links

- [[../01_fundamentals/api_design]] — API basics
- [[../02_building_blocks/rate_limiter]] — Rate limiting
- [[../02_building_blocks/api_gateway]] — Gateway patterns
- [[../10_hld/security_architecture]] — Auth in APIs
