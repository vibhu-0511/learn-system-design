#system-design #outage #distributed-systems

# Roblox 73-Hour Outage (2021)

## What Happened

On October 28, 2021, Roblox went completely offline for **73 hours** — the longest outage in the platform's history. 50M+ daily active users (mostly children) were affected.

## The Chain of Events

1. A routine Consul (service discovery) upgrade triggered a subtle bug
2. Under high load, Consul's cluster started having **performance degradation**
3. A streaming feature (just enabled) amplified the load on Consul servers
4. Consul nodes started failing health checks and getting removed from the cluster
5. **Cascading failure:** As nodes dropped, remaining nodes had more load → more failures
6. Service discovery broke → services couldn't find each other → everything went down
7. The root cause was hidden because monitoring ALSO depended on the failing infrastructure
8. Engineers spent 48 hours debugging before identifying Consul + streaming as the cause
9. Recovery required carefully rebuilding the Consul cluster from scratch

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Service discovery is critical infrastructure** — if it fails, everything fails | [[03_design_patterns/leader_election]] |
| **Cascading failures** from removing nodes under load | [[03_design_patterns/circuit_breaker]] |
| **Feature rollouts** can have unexpected interactions with infrastructure | Progressive rollout |
| **Monitoring can't depend on the thing being monitored** | Independent monitoring plane |
| **73 hours** — shows how hard distributed systems are to debug | Observability investment |

## The Key Takeaway

Your infrastructure dependencies (service discovery, DNS, config management) are your most critical systems. They need MORE redundancy and testing than your application code, not less.

## Links
- [[03_design_patterns/circuit_breaker]] — Prevent cascading failures
- [[02_building_blocks/monitoring_and_logging]] — Independent monitoring
