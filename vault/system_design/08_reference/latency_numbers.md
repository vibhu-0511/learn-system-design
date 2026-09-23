#system-design #reference

# Latency Numbers Every Programmer Should Know

*Originally by Jeff Dean (Google). Updated for modern hardware.*

## The Table

| Operation | Latency | Notes |
|-----------|---------|-------|
| L1 cache reference | 0.5 ns | CPU cache |
| L2 cache reference | 7 ns | |
| Main memory (RAM) reference | 100 ns | |
| Compress 1KB with Snappy | 3 μs | |
| Read 1MB sequentially from RAM | 250 μs | |
| Round trip within same datacenter | 500 μs | 0.5 ms |
| SSD random read | 150 μs | |
| Read 1MB sequentially from SSD | 1 ms | |
| HDD disk seek | 10 ms | |
| Read 1MB sequentially from HDD | 20 ms | |
| Send packet CA → Netherlands → CA | 150 ms | |
| TLS handshake | 250 ms | Multiple round trips |

## Visual Scale

```
L1 cache:     |
L2 cache:     |......|
RAM:          |......................................................|
SSD read:     |............ (×1000 slower than RAM)
Network (DC): |..........   (×1000 slower than RAM)
HDD seek:     |...................................................... (×100,000 slower than RAM)
Cross-ocean:  |...... (×1,000,000 slower than RAM)
```

## What This Means for System Design

| Insight | Implication |
|---------|-------------|
| RAM is 1000× faster than SSD | Caching in Redis (RAM) is huge win over DB (SSD) |
| SSD is 100× faster than HDD | Use SSDs for databases |
| Same-DC round trip is 0.5ms | Microservices in same DC add ~0.5ms per hop |
| Cross-continent is 150ms | Need CDN and multi-region for global users |
| HDD seek is 10ms | Avoid random disk access (use sequential: WAL, LSM) |

## Rules of Thumb

- **Cache anything accessed more than once** — RAM is 1000× faster than disk
- **Avoid network calls in loops** — Each call adds 0.5ms minimum
- **Sequential I/O >> Random I/O** — Design for sequential access (WAL, LSM trees)
- **Compress before sending** — Network is slower than CPU for compression
- **Keep data close to computation** — Same rack > same DC > cross-DC > cross-continent

## Links
- [[01_fundamentals/latency_and_throughput]] — Full latency concepts
- [[02_building_blocks/caching]] — Exploit the RAM vs disk gap
- [[02_building_blocks/cdn]] — Exploit the geographic latency gap
