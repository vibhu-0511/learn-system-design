#system-design #hld #interview

# Interviewer Pressure Moves — Prepared Responses

> These are the curveballs interviewers throw to test your depth. Prepare for them.

---

## "What if this component goes down?"

**For any component, have a failure strategy:**

| Component | Failure Strategy |
|-----------|-----------------|
| App server | Load balancer routes to healthy servers. Stateless = any server works. |
| Database primary | Auto-failover to replica (with possible brief downtime). Read replicas serve reads. |
| Cache (Redis) | Fall back to database. Higher latency but functional. |
| Message queue | Messages persist on disk. Consumers resume when queue recovers. |
| External API (payment gateway) | Circuit breaker → fallback (retry queue, alternative provider). |
| CDN | Origin server serves directly. Slower but functional. |

**Template answer:** "If [X] goes down, [Y] handles traffic using [Z mechanism]. There's a [trade-off], but the system stays [available/consistent]."

---

## "This won't scale to 10x"

**Response framework:**

1. Identify the bottleneck: "At 10x, the bottleneck would be [database writes / WebSocket connections / search indexing]"
2. Propose the fix: "We'd [shard the DB / add more WebSocket servers / partition the index]"
3. Show the path: "Our current design supports this because [it's stateless / the data model supports sharding / we've already decoupled with queues]"

**Common scaling moves:**
- App tier: Add more stateless servers behind load balancer
- Read bottleneck: Add cache layer or read replicas
- Write bottleneck: Shard database, async writes via queues
- Global latency: Multi-region deployment + CDN
- Single service overloaded: Decompose into smaller services

---

## "This is over-engineered"

**This is a GOOD challenge. Show you can simplify.**

> "You're right — at our current scale of 10K users, we don't need sharding or a message queue. I'd simplify to: monolith with PostgreSQL, Redis for caching, and process background jobs with a simple worker. As we grow past 100K, we'd add [X] to address [Y bottleneck]."

**Key:** Show you know the scaling path WITHOUT building it all upfront.

---

## "How would you handle data consistency here?"

| Scenario | Response |
|----------|----------|
| Payment + Inventory | "Saga pattern: process payment, reserve inventory, compensate on failure" |
| User sees own changes | "Read-your-writes: route user's reads to primary after their write" |
| Feed/timeline | "Eventual consistency is fine — 2-second delay is acceptable for social feeds" |
| Double-booking | "Optimistic locking: version check on update, retry on conflict" |

---

## "How would you test/monitor this?"

**Testing:**
- Unit tests for business logic
- Integration tests for API contracts
- Load tests: simulate expected QPS × 2
- Chaos engineering: randomly kill components (Netflix Simian Army)

**Monitoring:**
- RED metrics per service: Rate, Errors, Duration
- Database: query latency, connection pool usage, replication lag
- Queues: consumer lag, DLQ size
- Alerts: Error rate > 1%, P99 > 500ms, queue lag > 10K

---

## "What about security?"

**Checklist to mention:**
- Authentication at API gateway (JWT / OAuth)
- Authorization per endpoint (role-based access)
- Rate limiting (prevent abuse)
- Encryption in transit (TLS) and at rest (AES-256)
- Input validation (prevent injection)
- Secrets management (never hardcoded)
- Audit logging for sensitive operations

---

## "Walk me through what happens when a user does X"

**This is a trace walkthrough. Be specific:**

> "User clicks 'Buy Now':
> 1. Client sends POST /orders to API Gateway
> 2. Gateway authenticates via JWT, routes to Order Service
> 3. Order Service validates the cart, calls Inventory Service (sync gRPC) to reserve items
> 4. If items available, calls Payment Service (sync gRPC) to charge
> 5. Payment Service calls Stripe API, returns success/failure
> 6. On success: Order Service writes to DB, emits OrderPlaced event to Kafka
> 7. Notification Service (async) sends confirmation email
> 8. Client receives 201 Created with order details
> Total latency: ~300ms"

## Links

- [[hld_thinking_system]] — The thinking framework these responses support
- [[hld_review_checklist]] — Pre-validate your design against these questions
- [[../07_interview_framework/signal_moments]] — More ways to impress
