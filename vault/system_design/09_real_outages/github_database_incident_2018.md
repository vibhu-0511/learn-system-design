#system-design #outage #database #replication

# GitHub Database Incident (2018)

## What Happened

On October 21, 2018, GitHub experienced **24 hours and 11 minutes** of degraded service. It started with a routine 43-second network maintenance that disconnected the primary database from its replicas.

## The Chain of Events

1. **Network maintenance** disconnected the primary MySQL database cluster from replicas for 43 seconds
2. Orchestrator (automated failover tool) detected the primary was unreachable and **promoted a replica to primary**
3. The old primary came back online — now both nodes thought they were primary (**split-brain**)
4. Both primaries accepted writes independently for a brief period
5. **Data diverged** — different writes on different nodes
6. GitHub had to reconcile data manually — which took 24 hours
7. Some data (webhook deliveries, GitHub Pages builds) was delayed or lost

## Root Cause

- Automated failover was too aggressive — triggered on a planned, brief outage
- No fencing mechanism to prevent the old primary from accepting writes after failover
- Cross-datacenter replication lag meant replicas were behind when promoted

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| Automated failover needs careful tuning | [[03_design_patterns/leader_election]] |
| Split-brain is a real, devastating problem | [[03_design_patterns/replication]] |
| Fencing tokens prevent stale leaders from writing | [[03_design_patterns/leader_election]] |
| Test failover regularly, including recovery | Operations |
| Replication lag matters when promoting replicas | [[01_fundamentals/consistency_models]] |

## Links
- [[03_design_patterns/replication]] — Split-brain problem
- [[03_design_patterns/leader_election]] — Fencing tokens
