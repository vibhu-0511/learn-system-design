#system-design #outage #circular-dependency #monitoring

# Datadog Outage (2023)

## What Happened

In March 2023, Datadog experienced a major outage after a **systemd security update** was automatically applied across all cloud providers simultaneously. The update changed iptables and network filtering rules, breaking connectivity across their infrastructure. As a monitoring platform, Datadog's own monitoring was affected — a circular dependency.

## The Chain of Events

1. A systemd security patch was released by upstream Linux distributions
2. Datadog's infrastructure had auto-update policies that applied OS-level patches immediately
3. The update rolled out across **all availability zones and cloud providers at the same time**
4. The new systemd version modified iptables rules and network filtering behavior
5. Internal service-to-service communication broke due to changed network rules
6. Datadog's own monitoring dashboards and alerting went down — they lost visibility into the outage
7. Engineers had to diagnose the issue without their own observability platform
8. The simultaneous global rollout meant there was no healthy region to fail over to
9. Manual rollback of the systemd update was required across the entire fleet

## Root Cause

- OS-level security updates were applied globally without staggering across regions or AZs
- No pre-deployment validation of systemd updates against production network configurations
- Circular dependency: the monitoring platform depended on the infrastructure it was monitoring
- Auto-apply policies for security patches had no blast-radius controls

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Stagger OS-level updates** across AZs and regions — never apply globally at once | Progressive rollout |
| Never auto-apply patches without canary validation | Safe deployment practices |
| Monitoring systems must have **independent observability** that doesn't depend on themselves | Avoid circular dependencies |
| Security patches can break production just like application code | Change management |
| Maintain a healthy control region that receives updates last | Fault isolation |

## The Key Takeaway

A monitoring platform that monitors itself has a fatal circular dependency. OS-level updates are just as dangerous as application deployments and need the same staggered rollout, canary validation, and rollback capability.

## Links
- [[06_trade_offs/consistency_vs_availability]] — global update traded availability for consistency
- [[02_building_blocks/rate_limiter]] — rate-limiting change propagation across infrastructure
