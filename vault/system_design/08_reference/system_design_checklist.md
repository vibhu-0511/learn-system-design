#system-design #reference #checklist

# System Design Checklist

> Walk through this for any new project or design. Check each item.

## 1. Requirements
- [ ] Core functional requirements defined
- [ ] Non-functional requirements (latency, throughput, availability)
- [ ] Scale estimation (users, QPS, storage)
- [ ] Read:write ratio
- [ ] Consistency requirements per feature

## 2. Data Model
- [ ] Core entities identified
- [ ] Relationships defined
- [ ] Access patterns listed (how will data be queried?)
- [ ] Database choice justified (SQL vs NoSQL vs both)
- [ ] Indexes planned for main query patterns

## 3. API Design
- [ ] Core endpoints defined (REST/GraphQL/gRPC)
- [ ] Pagination strategy (cursor vs offset)
- [ ] Authentication method (JWT, API key, OAuth)
- [ ] Rate limiting strategy
- [ ] API versioning approach

## 4. High-Level Architecture
- [ ] Load balancer in front of app servers
- [ ] Stateless application servers
- [ ] Caching strategy (what, where, TTL, invalidation)
- [ ] CDN for static assets
- [ ] Async processing for heavy work (message queues)

## 5. Scaling Plan
- [ ] Identified the bottleneck (CPU? DB? Network?)
- [ ] Caching layer designed
- [ ] Read replica strategy
- [ ] Sharding strategy (if needed, with shard key)
- [ ] Auto-scaling configuration

## 6. Reliability
- [ ] No single points of failure
- [ ] Failover strategy for databases
- [ ] Circuit breakers for external dependencies
- [ ] Retry strategy with exponential backoff
- [ ] Dead letter queues for failed messages

## 7. Monitoring
- [ ] Key metrics identified (latency, error rate, throughput)
- [ ] SLOs defined
- [ ] Alerting thresholds set
- [ ] Distributed tracing planned
- [ ] Structured logging format

## 8. Security
- [ ] Authentication and authorization
- [ ] Data encryption (at rest + in transit)
- [ ] Input validation
- [ ] Rate limiting
- [ ] Secrets management

## Links
- [[07_interview_framework/the_four_step_framework]] — Interview version of this checklist
