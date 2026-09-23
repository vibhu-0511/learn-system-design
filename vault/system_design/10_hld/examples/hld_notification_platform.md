#system-design #hld #example #notifications

# HLD: Notification Platform (Multi-Channel)

## Problem Type: Data Pipeline + Coordination System

---

## Architect's Playback

> "A notification platform is essentially a high-throughput pipeline: events come in, get routed to the right channel (push/SMS/email), templated, rate-limited, and delivered. The core challenge is reliability at scale — 10B+ notifications/day with zero duplication and no lost messages. Provider failover is critical: if Twilio is down, switch to Vonage automatically."

## Architecture

```mermaid
graph TD
    Services[Internal Services] --> API[Notification API]
    API --> Valid[Validation + Dedup + Preferences]
    Valid --> Priority[Priority Router]

    Priority --> PushQ[Kafka: Push Topic]
    Priority --> SMSQ[Kafka: SMS Topic]
    Priority --> EmailQ[Kafka: Email Topic]

    PushQ --> PushW[Push Workers]
    SMSQ --> SMSW[SMS Workers]
    EmailQ --> EmailW[Email Workers]

    PushW --> APNs[Apple APNs]
    PushW --> FCM[Google FCM]
    SMSW --> Twilio[Twilio Primary]
    SMSW --> Vonage[Vonage Failover]
    EmailW --> SES[AWS SES Primary]
    EmailW --> SG[SendGrid Failover]

    PushW --> Track[Delivery Tracker]
    SMSW --> Track
    EmailW --> Track
    Track --> TrackDB[(Cassandra: Delivery Status)]

    PushW --> DLQ[Dead Letter Queue]
    SMSW --> DLQ
    EmailW --> DLQ
```

## Key Decisions

**Kafka per channel per priority:** Separate topics allow independent scaling. High-priority push gets more consumers than low-priority email.

**Provider failover with circuit breaker:** If Twilio error rate > 5% for 30 seconds, circuit opens, traffic routes to Vonage. Half-open after 60 seconds: test with 1% of traffic.

**Idempotent delivery:** Every notification gets a unique ID. Workers check "already sent?" before delivering. At-least-once from Kafka + dedup at worker = effectively exactly-once.

**User preferences:** Check before sending: user opted out of marketing email? Don't send. User set quiet hours 10PM-8AM? Delay until 8AM.

**Rate limiting per user:** Max 3 push/hour, 1 SMS/day for marketing. No limit for transactional (OTP, receipts).

---

## Links

- [[../../05_case_studies/design_notification_system]] — Detailed case study
- [[../../02_building_blocks/message_queues]] — Kafka pipeline
- [[../../03_design_patterns/circuit_breaker]] — Provider failover
- [[../../02_building_blocks/rate_limiter]] — Per-user limits
