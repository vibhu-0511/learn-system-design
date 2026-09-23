#system-design #interview #estimation

# Back-of-Envelope Estimation Cheat Sheet

---

## Powers of Two (See [[08_reference/powers_of_two]])

| Power | Value | Meaning |
|-------|-------|---------|
| 2^10 | 1 Thousand | 1 KB |
| 2^20 | 1 Million | 1 MB |
| 2^30 | 1 Billion | 1 GB |
| 2^40 | 1 Trillion | 1 TB |

## Time Conversions

| Period | Seconds |
|--------|---------|
| 1 day | 86,400 (~10^5) |
| 1 month | 2.6M (~2.5 × 10^6) |
| 1 year | 31.5M (~3 × 10^7) |

**Quick trick:** Seconds in a day ≈ 100,000. So **1M requests/day ≈ ~12 QPS**.

## Common QPS Estimates

| DAU | Actions/user/day | QPS | Peak QPS (×3) |
|-----|-------------------|-----|---------------|
| 1M | 10 | ~115 | ~350 |
| 10M | 10 | ~1,150 | ~3,500 |
| 100M | 10 | ~11,500 | ~35,000 |

## Storage Estimation Template

```
Items per day × Size per item × Retention days = Total storage

Example: Chat messages
- 50M DAU × 40 messages/day = 2B messages/day
- 200 bytes/message × 2B = 400GB/day
- 5-year retention: 400GB × 365 × 5 = ~730TB
```

## Bandwidth Estimation Template

```
QPS × Average response size = Bandwidth

Example: Image service
- 10,000 QPS × 200KB average image = 2GB/sec = 16 Gbps
```

## Server Estimation

| Server Type | Handles |
|-------------|---------|
| Web server (Node/Python) | ~1,000 concurrent connections |
| Application server | ~500 QPS (depends on work) |
| Database (PostgreSQL) | ~5,000 QPS simple queries |
| Redis | ~100,000 QPS |
| Kafka broker | ~1M messages/sec |

```
Servers needed ≈ Peak QPS / QPS per server

Example: 35,000 peak QPS / 500 per server = 70 app servers
```

## Common Data Sizes

| Data | Approximate Size |
|------|-----------------|
| Tweet/short text | 1 KB |
| User profile | 2-5 KB |
| Image (compressed) | 200 KB |
| Video minute (compressed) | 50 MB |
| 1 hour video (HD) | 3 GB |

## Practice Problems

**1. URL Shortener:** 100M URLs/month. Storage for 5 years?
→ 100M × 12 × 5 = 6B URLs × 500 bytes = **3TB**

**2. Twitter:** 500M users, 200M DAU, 2 tweets/user/day. Write QPS?
→ 400M tweets/day / 86400 ≈ **4,600 writes/sec**

**3. WhatsApp:** 50M DAU, 40 messages/user/day. Messages/sec?
→ 2B/day / 86400 ≈ **23,000 messages/sec**

## Links
- [[the_four_step_framework]] — When to use estimation (Step 2)
- [[08_reference/latency_numbers]] — Latency reference
- [[08_reference/powers_of_two]] — Full powers of two table
