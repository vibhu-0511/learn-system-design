#system-design #hld #checklist

# HLD Review Checklist — Validate Before You Present

> Run through this BEFORE saying "I'm done with the high-level design."

## Completeness

- [ ] All core user flows can be traced on the diagram
- [ ] Data model covers main entities and relationships
- [ ] API endpoints defined for key operations
- [ ] Read path AND write path are clear
- [ ] Async vs sync decisions are explicit and justified

## Scalability

- [ ] No single database handling all reads AND writes without a plan
- [ ] Caching strategy defined (what, where, TTL, invalidation)
- [ ] Stateless services (can add more instances freely)
- [ ] Heavy processing is async (queues, workers)
- [ ] Static content served via CDN

## Reliability

- [ ] No single point of failure (every component has redundancy plan)
- [ ] Failure of any one service doesn't take down the whole system
- [ ] Circuit breakers on external/unreliable dependencies
- [ ] Data is durable (replicated, backed up)

## Consistency

- [ ] Clear about where strong vs eventual consistency is used
- [ ] No distributed transactions without explicit coordination (saga/2PC)
- [ ] Cache invalidation strategy defined

## Operational Readiness

- [ ] Monitoring: key metrics identified (latency, error rate, throughput)
- [ ] Alerting: what triggers pages vs warnings
- [ ] Logging: structured, with correlation IDs across services

## Decision Quality

- [ ] Every technology choice has a reason (not just "everyone uses it")
- [ ] Trade-offs are acknowledged, not hidden
- [ ] Design can evolve (not locked into premature decisions)
- [ ] Started simple, added complexity only where justified

## Links

- [[hld_thinking_system]] — The process that produces good designs
- [[interviewer_pressure_moves]] — Challenges your design should survive
