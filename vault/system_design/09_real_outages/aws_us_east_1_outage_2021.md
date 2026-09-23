#system-design #outage #cloud #aws

# AWS us-east-1 Outage (December 2021)

## What Happened

On December 7, 2021, AWS's **us-east-1 region** (the oldest and most used region) experienced a major outage lasting **~7 hours**. Affected: Netflix, Disney+, Slack, DoorDash, Venmo, McDonald's app, and thousands of businesses.

## The Chain of Events

1. An automated process to scale internal networking capacity went wrong
2. The process created **a flood of connection requests** to internal AWS networking devices
3. These devices were overwhelmed → network congestion within AWS internal network
4. Many AWS services (EC2, ECS, Lambda, DynamoDB, SQS) became unavailable or degraded
5. **Even the AWS status dashboard and support console were affected** (again — dependency on failing region)
6. Services in other regions were fine, but most businesses only deploy in us-east-1

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **us-east-1 is not invincible** — even AWS's flagship region fails | Multi-region design |
| **Don't put everything in one region** | Geographic distribution |
| Internal networking is a hidden dependency | Infrastructure awareness |
| **Status pages must be independently hosted** (AWS learned this, again) | Independent monitoring |
| Automation can cause outages at scale | Progressive automation |

## The Key Takeaway

If your business depends on one AWS region, you're one incident away from a total outage. For critical systems, deploy across at least 2 regions with failover. At minimum, ensure your architecture can gracefully degrade when a single region is impaired.

## Links

- [[amazon_s3_outage_2017]] — Same region, same lesson
- [[../15_intermediate_topics/cloud_architecture_patterns]] — Multi-region patterns
