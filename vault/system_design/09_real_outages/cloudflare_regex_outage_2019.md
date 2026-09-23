#system-design #outage #deployment #testing

# Cloudflare Regex Outage (2019)

## What Happened

On July 2, 2019, a single regular expression in a firewall rule caused **all Cloudflare edge servers worldwide to spike to 100% CPU**, taking down millions of websites for **27 minutes**.

## The Chain of Events

1. Engineer deployed a new WAF (Web Application Firewall) rule
2. The rule contained a **catastrophic backtracking regex**: `(?:(?:\"|'|\]|\}|\\|\d|(?:nan|infinity|true|false|null|undefined|symbol|math)|\`|\-|\+)+[)]*;?((?:\s|-|~|!|{}|\|\||\+)*.*(?:.*=.*)))`
3. This regex caused **exponential CPU usage** when processing certain HTTP requests
4. Every Cloudflare edge server (in 200+ cities) began processing this regex
5. CPU hit 100% globally within seconds
6. All Cloudflare-proxied websites went down simultaneously
7. Cloudflare serves ~10% of all HTTP requests

## Root Cause

- Regex with catastrophic backtracking deployed without adequate testing
- No CPU usage limits per WAF rule (one rule could consume all CPU)
- Global deployment (no canary or staged rollout)
- WAF rule testing didn't include performance testing for pathological inputs

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Test for performance, not just correctness** | Load testing |
| Canary deployments prevent global failures | Progressive rollout |
| Resource limits per component (CPU, memory) | [[03_design_patterns/circuit_breaker]] |
| One bad rule shouldn't take down everything | Fault isolation, bulkheads |
| Automated rollback on anomaly detection | [[02_building_blocks/monitoring_and_logging]] |

## The Key Takeaway

Always deploy changes gradually (canary → 1% → 10% → 100%). If Cloudflare had deployed to 1 city first and monitored CPU, this would have been a 1-city blip instead of a global outage.

## Links
- [[back_pressure]] — Resource limits
- [[02_building_blocks/monitoring_and_logging]] — Anomaly detection
