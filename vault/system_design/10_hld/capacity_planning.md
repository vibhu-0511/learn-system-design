#system-design #hld #estimation

# Capacity Planning — From Estimation to Infrastructure

## Intuition (30 sec)

Capacity planning = "How many servers, how much storage, how much bandwidth do we actually need?" It bridges back-of-envelope estimation to real infrastructure decisions.

---

## The Formula

```
1. Estimate traffic (QPS)
2. Estimate per-request resource usage (CPU, memory, I/O)
3. Calculate total resource needs
4. Add headroom (2-3x for peak)
5. Map to infrastructure (server count, DB size, bandwidth)
```

---

## Server Capacity

### Web/API Servers

| Server Type | Handles (approx) |
|------------|-------------------|
| Node.js (4 core) | 2,000-5,000 simple req/sec |
| Java/Spring (8 core) | 1,000-3,000 req/sec |
| Go (4 core) | 5,000-20,000 req/sec |
| Python/Django (4 core) | 500-1,000 req/sec |

```
Servers needed = Peak QPS / QPS per server × safety factor (1.5)

Example: 50,000 peak QPS on Spring Boot
= 50,000 / 2,000 × 1.5 = 37.5 → 38 servers
Round up to 40 for easy scaling.
```

### Database Capacity

| Database | Read QPS | Write QPS | Storage |
|----------|----------|-----------|---------|
| PostgreSQL (single) | 10,000 | 5,000 | 1-10TB |
| PostgreSQL + replicas | 30,000+ reads | 5,000 writes | 1-10TB |
| Redis (single) | 100,000 | 100,000 | 25GB (RAM) |
| Cassandra (3-node) | 30,000 | 30,000 | 1-100TB |
| Elasticsearch (3-node) | 10,000 | 5,000 | 1-50TB |

### Storage Estimation

```
Daily data = items/day × size/item
Monthly data = daily × 30
Yearly data = daily × 365
5-year data = daily × 1825

Factor in: compression (2-10x), replication (2-3x), indexes (+30%)
```

---

## Bandwidth Planning

```
Bandwidth = QPS × average response size

Example: Video streaming
- 20M concurrent users × 5 Mbps = 100 Tbps
- This is why Netflix uses CDN (serves from edge, not origin)

Example: API service
- 10,000 QPS × 5 KB response = 50 MB/sec = 400 Mbps
- Single server can handle this easily
```

---

## Cost Estimation (AWS Rough Pricing)

| Resource | Monthly Cost (approx) |
|----------|---------------------|
| EC2 t3.large (2 vCPU, 8GB) | $60 |
| EC2 c5.2xlarge (8 vCPU, 16GB) | $250 |
| RDS PostgreSQL db.r5.xlarge | $350 |
| ElastiCache Redis r5.large | $200 |
| S3 storage (per TB) | $23 |
| CloudFront CDN (per TB transfer) | $85 |
| Kafka (MSK 3-broker) | $500 |

```
Example: Medium-scale web app
- 10 API servers (c5.2xlarge): $2,500
- 1 RDS primary + 2 replicas: $1,050
- 1 Redis cluster: $400
- 10TB S3: $230
- CDN: $850
- Kafka: $500
Total: ~$5,530/month
```

---

## Interview Application

In estimation phase, end with:
> "At 50K peak QPS, we'd need about 40 Spring Boot servers, a PostgreSQL cluster with 2 read replicas, a 3-node Redis cluster, and roughly 50TB of S3 storage over 5 years. Monthly infrastructure cost around $8,000 on AWS."

This shows you can translate design into real infrastructure.

## Links
- [[../07_interview_framework/estimation_cheat_sheet]] — Quick estimation formulas
- [[../08_reference/latency_numbers]] — Performance baselines
- [[../06_trade_offs/cost_vs_performance]] — Cost optimization
