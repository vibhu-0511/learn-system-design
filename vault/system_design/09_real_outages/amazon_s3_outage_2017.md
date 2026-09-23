#system-design #outage #cascading #availability

# Amazon S3 Outage (2017)

## What Happened

On February 28, 2017, a single typo in a command took down a large portion of the internet for **4 hours**. An engineer intended to remove a small set of S3 servers but accidentally removed a much larger set in the US-East-1 region.

## The Chain of Events

1. Engineer ran a command to take a few billing servers offline for maintenance
2. **Typo** caused more servers to be removed than intended
3. Two critical S3 subsystems went down — the index (metadata) and placement (allocation)
4. Without the index, S3 couldn't find any objects. Without placement, no new writes.
5. The entire US-East-1 S3 region was down
6. **Cascading failures:** Thousands of services depend on S3 — including the AWS status dashboard itself (it couldn't show the outage because it uses S3)
7. Slack, Trello, Quora, IFTTT, and many others went down

## Root Cause

- No rate limiting on server removal commands (could remove thousands at once)
- No validation: "Are you sure you want to remove 10,000 servers?"
- Too many services had hard dependencies on a single S3 region
- The AWS status page itself depended on the service that was down

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Blast radius matters** — one failure shouldn't cascade | Fault isolation |
| Rate limit destructive operations | [[02_building_blocks/rate_limiter]] |
| Don't put all eggs in one basket (region) | Multi-region deployment |
| Status pages should be independently hosted | Avoid circular dependencies |
| Human error is the #1 cause of outages | Automation with safeguards |

## The Key Takeaway

If your entire system depends on one AWS region, you WILL eventually go down with it. Design for regional failures.

## Links
- [[06_trade_offs/consistency_vs_availability]] — S3 chose availability, but infrastructure failure broke it
- [[02_building_blocks/blob_storage]] — S3 architecture
