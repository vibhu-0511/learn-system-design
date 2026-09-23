#system-design #hld #documentation

# Architecture Decision Records (ADRs)

## Intuition (30 sec)

A courtroom keeps records of every ruling with the reasoning, not just the verdict. ADRs do the same for architecture — they capture WHY you made each decision, not just WHAT you chose. Six months later, you (or your team) can understand the reasoning.

## Why ADRs Matter

Without ADRs: "Why are we using Kafka here?" → "I don't know, it was here when I joined."
With ADRs: "Why are we using Kafka?" → "ADR-003: We chose Kafka over SQS because we need message replay for the analytics pipeline and 500K msgs/sec throughput."

---

## ADR Template

```markdown
# ADR-{number}: {Title}

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Context
What is the problem or situation that requires a decision?

## Constraints
What forces are acting on this decision? (scale, latency, team, cost...)

## Options Considered

### Option A: {Name}
- How it works
- Pros
- Cons

### Option B: {Name}
- How it works
- Pros
- Cons

### Option C: {Name} (if applicable)

## Decision
Which option and WHY. Reference the constraints that drove the choice.

## Consequences
- What improves
- What gets harder
- What new problems does this create
- When would we revisit this decision
```

---

## Example ADRs

### ADR-001: Database Choice for User Data

**Context:** We need to store user profiles, relationships (followers), and authentication data. Expected: 50M users, 10K reads/sec, 500 writes/sec.

**Options:**
| | PostgreSQL | MongoDB | DynamoDB |
|--|-----------|---------|----------|
| Schema | Rigid, relationships | Flexible | Key-value |
| Transactions | Full ACID | Limited | Limited |
| Joins | Native | None | None |
| Scaling | Vertical + replicas | Horizontal | Horizontal (managed) |
| Ops burden | Medium | Medium | Low |

**Decision:** PostgreSQL. User data has clear relationships (followers, likes), needs ACID for auth, and 10K reads/sec is well within PostgreSQL's capacity with read replicas. We don't need horizontal write scaling at 500 writes/sec.

**Consequences:** We'll need to manage read replicas ourselves. If we hit 100K writes/sec, we'd need to revisit (consider sharding or moving follower graph to a graph DB).

---

### ADR-002: Sync vs Async for Notifications

**Context:** When a user likes a post, we need to notify the post owner. Current: synchronous call to notification service, adding 200ms to the like API response.

**Options:**
- **Option A: Keep synchronous** — Simple, guaranteed delivery, but 200ms slower
- **Option B: Async via message queue** — Fast API response, notification sent eventually

**Decision:** Async via Kafka. Like response time should be <50ms. Notification delay of 1-2 seconds is perfectly acceptable. Kafka gives us replay capability for debugging.

**Consequences:** Need to handle message queue failures. Notification might be delayed under load. Need DLQ for failed notifications.

---

## Using ADRs in Interviews

You don't write formal ADRs in an interview, but you USE the thinking:

> "For the database, I considered PostgreSQL for its ACID guarantees and MongoDB for its flexible schema. Given that our data has clear relationships and we need transactions for payments, I'd go with PostgreSQL. The trade-off is we'll need more effort to scale writes, but at our estimated 500 writes/sec, that's not a concern yet."

This 15-second statement IS an ADR delivered verbally. It shows: options considered, decision made, reasoning, trade-offs acknowledged.

## Links

- [[hld_thinking_system]] — Constraints that drive ADRs
- [[../06_trade_offs/sql_vs_nosql]] — Common ADR topic
- [[../06_trade_offs/consistency_vs_availability]] — Common ADR topic
