#system-design #outage #kubernetes #dns #thundering-herd

# OpenAI DNS/Kubernetes Outage (2024)

## What Happened

On December 11, 2024, ChatGPT and the OpenAI API went down globally for approximately **4 hours**. A new telemetry service deployed to Kubernetes clusters overwhelmed the K8s API servers. DNS caching initially masked the problem, but when cached entries expired simultaneously, a **thundering herd** of DNS lookups amplified the failure.

## The Chain of Events

1. OpenAI deployed a new telemetry service across their Kubernetes clusters
2. The service made frequent calls to the **Kubernetes API server** for service discovery
3. The K8s API servers became overloaded but continued responding — slowly
4. DNS resolution for internal services was cached, so applications kept working initially
5. As DNS cache TTLs expired, pods began making fresh DNS queries
6. The overloaded K8s API servers couldn't handle the DNS resolution requests
7. TTLs expired **roughly simultaneously** across pods — creating a thundering herd
8. All internal service discovery failed at once — ChatGPT, API, and internal tools went down
9. The cascading failure was difficult to diagnose because monitoring itself relied on the same DNS
10. Engineers had to manually scale down the telemetry service and restart DNS infrastructure

## Root Cause

- New telemetry service was not load-tested against the Kubernetes **control plane** (API servers)
- Testing focused on data plane capacity (can it handle the telemetry volume?) not control plane impact
- DNS cache TTLs were uniform, causing synchronized expiry and thundering herd
- No rate limiting on K8s API server calls from internal services
- The telemetry service had no circuit breaker for API server communication

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Load-test new services against the control plane**, not just the data plane | Capacity planning |
| Stagger DNS TTL expiry with jitter to prevent thundering herd | [[02_building_blocks/rate_limiter]] |
| K8s API server is a shared resource — treat it like a database | Resource contention |
| New services need circuit breakers for infrastructure dependencies | Circuit breaker pattern |
| DNS caching can mask problems until it makes them worse | Cascading failures |

## The Key Takeaway

DNS caching is a double-edged sword: it absorbs load spikes but creates thundering herds when caches expire together. Any new service that talks to the Kubernetes control plane must be load-tested against the API server, not just the workloads it processes.

## Links
- [[02_building_blocks/rate_limiter]] — rate limiting control plane access
- [[06_trade_offs/consistency_vs_availability]] — cached DNS traded consistency for availability until the cache failed
