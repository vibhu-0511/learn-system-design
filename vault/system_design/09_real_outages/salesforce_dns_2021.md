#system-design #outage #dns #change-management #process

# Salesforce DNS Outage (2021)

## What Happened

On May 11, 2021, Salesforce suffered a **multi-hour global outage** affecting its core CRM platform, Pardot, and other services. A DNS configuration change made during an **emergency break-fix procedure** caused Salesforce's perimeter services to lose the ability to resolve internal hostnames, effectively cutting off the platform from its own backend infrastructure.

## The Chain of Events

1. An engineer initiated a DNS configuration change as part of an **emergency break-fix** process
2. The emergency process **bypassed the standard change review** and approval workflow
3. The DNS change caused Salesforce's **perimeter services** (edge proxies, load balancers) to fail internal hostname resolution
4. Without internal DNS resolution, perimeter services could not route traffic to backend services
5. The entire Salesforce platform became unreachable for customers globally
6. Because DNS resolution was broken internally, many monitoring and recovery tools were also impaired
7. Engineers had to manually correct the DNS configuration and wait for propagation, extending the recovery to **multiple hours**

## Root Cause

- A DNS change was made through an **emergency process** that skipped standard change review
- DNS changes have an inherently **high blast radius** — a single bad record can break all service resolution
- The change management process had an escape hatch that lacked sufficient safeguards
- Internal tooling and monitoring depended on the same DNS infrastructure that was broken

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **DNS changes are high blast radius** — treat them with extreme caution | Risk classification |
| Never skip change review for "emergency" fixes — emergencies need MORE review, not less | Change management |
| Internal tooling must not depend on the infrastructure it monitors | Circular dependency avoidance |
| DNS propagation delays make rollback slow | Recovery time planning |
| Break-fix processes need the same guardrails as standard deployments | Process discipline |

## The Key Takeaway

The most dangerous changes are the ones made in a hurry. If your emergency process allows bypassing review for DNS changes, you have a process gap that will eventually cause the very emergency you were trying to prevent.

## Links
- [[02_building_blocks/dns]] — DNS architecture and resolution risks
- [[06_trade_offs/consistency_vs_availability]] — DNS consistency vs. recovery speed
