#system-design #outage #deployment #finance

# Knight Capital Trading Disaster (2012)

## What Happened

On August 1, 2012, Knight Capital Group lost **$440 million in 45 minutes** due to a software deployment error. The company went from profitable to nearly bankrupt in under an hour.

## The Chain of Events

1. Knight was deploying new trading software to 8 servers
2. A technician **forgot to deploy to one of the 8 servers** (server 7)
3. Server 7 still had old code — which contained a **dead code flag** from years ago
4. The old code, when activated by the new deployment's configuration, triggered an **aggressive buying algorithm**
5. Server 7 began buying stocks at market price and selling below market price
6. The system was **buying high and selling low** at enormous speed
7. By the time they identified the problem (45 minutes), Knight had accumulated $7 billion in unwanted positions
8. Net loss: **$440 million**
9. Knight Capital was acquired by another firm days later

## Root Cause

- Dead code was never removed (old trading algorithm left in codebase)
- No automated deployment verification (1 of 8 servers missed)
- No kill switch to immediately halt trading
- No real-time position monitoring with automatic stop-loss
- Feature flag reuse — old flag repurposed, accidentally activated old code

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Remove dead code** — it's a liability, not just clutter | Code maintenance |
| Automated deployment verification (all servers match) | Deployment safety |
| **Kill switches** for critical systems | Circuit breaker / emergency stop |
| Real-time monitoring with automatic safety limits | [[02_building_blocks/monitoring_and_logging]] |
| Don't reuse feature flags | Feature flag hygiene |
| Canary deployments catch mismatched servers | Progressive rollout |

## The Key Takeaway

For critical systems: automated deployment verification, real-time anomaly detection, and kill switches are not optional. The cost of NOT having them can be existential.

## Links
- [[03_design_patterns/circuit_breaker]] — Automatic safety stops
- [[02_building_blocks/monitoring_and_logging]] — Real-time anomaly detection
