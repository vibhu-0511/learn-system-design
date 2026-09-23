#system-design #outage #database

# Slack Database Incident (2024)

## What Happened

In February 2024, Slack experienced a significant outage where users couldn't send messages, load channels, or access the platform for several hours. The root cause was a database issue during a routine maintenance operation.

## The Chain of Events

1. Slack performed a planned database maintenance operation
2. The operation caused unexpected **lock contention** on critical tables
3. Read queries piled up behind the locked writes
4. Connection pools exhausted across application servers
5. Health checks started failing → load balancer removed servers
6. Fewer servers → more load on remaining → cascade
7. Users saw: messages not sending, channels not loading, "connecting..." spinner
8. Resolution required: stopping the maintenance, clearing locks, gradually restoring traffic

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Database maintenance under load** is dangerous | Maintenance windows |
| **Connection pool exhaustion** cascades quickly | [[02_building_blocks/databases_sql]] — connection pooling |
| **Test maintenance operations** on replica first | Staging environment |
| Lock contention on write-heavy tables blocks everything | [[03_design_patterns/database_indexing]] — lock granularity |
| **Circuit breakers** could have limited cascade | [[03_design_patterns/circuit_breaker]] |

## The Key Takeaway

Database maintenance operations should ALWAYS be tested on a replica first under production-like load. Connection pool limits and circuit breakers prevent one slow query from taking down the entire system.

## Links
- [[02_building_blocks/databases_sql]] — Connection pooling
- [[03_design_patterns/circuit_breaker]] — Cascade prevention
