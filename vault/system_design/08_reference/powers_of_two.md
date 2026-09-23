#system-design #reference

# Powers of Two — For Quick Estimation

| Power | Exact | Approx | Data Unit |
|-------|-------|--------|-----------|
| 2^10 | 1,024 | ~1 Thousand | 1 KB |
| 2^16 | 65,536 | ~65 Thousand | 64 KB |
| 2^20 | 1,048,576 | ~1 Million | 1 MB |
| 2^30 | 1,073,741,824 | ~1 Billion | 1 GB |
| 2^32 | 4,294,967,296 | ~4 Billion | 4 GB (IPv4 addresses) |
| 2^40 | 1,099,511,627,776 | ~1 Trillion | 1 TB |
| 2^50 | ~1.13 × 10^15 | ~1 Quadrillion | 1 PB |

## Common Conversions

```
1 KB  = 1,000 bytes (10^3)
1 MB  = 1,000 KB    (10^6)
1 GB  = 1,000 MB    (10^9)
1 TB  = 1,000 GB    (10^12)
1 PB  = 1,000 TB    (10^15)
```

## Useful for Estimation

- **Characters in ASCII:** 1 byte each. 280-char tweet = ~300 bytes with metadata
- **UTF-8 characters:** 1-4 bytes. Most English = 1 byte, Chinese/Japanese = 3 bytes
- **64-bit integer:** 8 bytes. A billion 64-bit IDs = 8 GB
- **UUID:** 16 bytes (128 bits)
- **IPv4 address:** 4 bytes (32 bits) = 4.3B possible addresses
- **IPv6 address:** 16 bytes (128 bits)

## Links
- [[07_interview_framework/estimation_cheat_sheet]] — Full estimation guide
