#system-design #outage #cdn #cascading

# Fastly CDN Outage (2021) — When the CDN Goes Down

## What Happened

On June 8, 2021, Fastly (a major CDN provider) went down for **~1 hour**, taking offline: **Amazon, Reddit, Twitch, GitHub, Stack Overflow, The New York Times, BBC, UK Government websites**, and thousands more.

## The Chain of Events

1. A customer pushed a valid configuration change that triggered **a previously undetected bug** in Fastly's software
2. The bug caused 85% of Fastly's global network to return **503 errors**
3. Within seconds, major websites worldwide were unreachable
4. Fastly identified the issue in ~1 minute, deployed a fix in ~49 minutes
5. Most services restored within the hour

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **CDN is a single point of failure** for most websites | Redundancy, multi-CDN |
| A valid customer config triggered a latent bug → edge cases matter | Testing |
| **Multi-CDN strategy** prevents total outage | Use Cloudflare + Fastly + CloudFront |
| The internet has surprising concentration → few providers serve most traffic | Concentration risk |
| **Graceful degradation:** Serve stale content when CDN is down | Cache fallback |

## The Key Takeaway

If your entire site depends on ONE CDN, you WILL go down when that CDN has issues. Consider multi-CDN with DNS-based failover, or at minimum, ensure your origin can handle direct traffic (even at degraded performance) when the CDN fails.

## Links

- [[../02_building_blocks/cdn]] — CDN architecture
- [[amazon_s3_outage_2017]] — Similar cascading dependency failure
