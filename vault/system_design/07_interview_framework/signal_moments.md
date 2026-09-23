#system-design #interview

# Signal Moments (What Makes Interviewers Say "Hire")

---

### 1. Proactively Discussing Trade-offs
"We could use SQL or NoSQL here. I'd go with Cassandra because our write throughput is 50K/sec and we can accept eventual consistency for the timeline. The trade-off is losing JOINs, but our access pattern is simple key-value lookups."

### 2. Back-of-Envelope Estimation (Unprompted)
"Let me quickly estimate the QPS: 200M DAU, 5 reads per day, that's about 11,500 reads/sec, peak maybe 35K. A single PostgreSQL instance handles about 5K QPS, so we'd need read replicas."

### 3. Mentioning Monitoring & Observability
"We'd add Prometheus metrics for P99 latency, error rate, and queue depth. Distributed tracing with Jaeger to debug slow requests across services. Our SLO would be P99 < 200ms."

### 4. Failure Mode Thinking
"What if Redis goes down? We'd fall back to the database — higher latency but still functional. For the message queue, we'd use at-least-once delivery with idempotent consumers so no messages are lost."

### 5. Starting Simple, Then Scaling
"For 10K users, a single PostgreSQL instance with caching is plenty. As we grow, we'd add read replicas, then sharding. I don't want to over-engineer for day one."

### 6. Naming Specific Numbers
"P99 latency under 200ms, 99.99% availability, 10TB storage over 5 years" — shows you've done the math, not just hand-waving.

### 7. Bringing Up Real-World Examples
"Twitter solved this with a hybrid fan-out approach — push for regular users, pull for celebrities with millions of followers."

### 8. Considering Cost
"We'd use S3 tiered storage — hot storage for recent data, Glacier for archives. This alone could save 60% on storage costs."

### 9. Security Awareness
"Authentication at the API gateway, rate limiting to prevent abuse, encrypted data at rest and in transit."

### 10. Acknowledging What You Don't Know
"I'm not 100% sure about the specifics of HLS streaming, but the concept is: video is split into chunks at multiple quality levels, and the client adapts based on bandwidth."

## Links
- [[common_red_flags]] — What to avoid
- [[the_four_step_framework]] — Structure that enables signal moments
