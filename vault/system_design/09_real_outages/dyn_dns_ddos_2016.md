#system-design #outage #dns #ddos #iot

# Dyn DNS DDoS Attack (2016)

## What Happened

On October 21, 2016, a massive **DDoS attack** targeted Dyn, a major managed DNS provider. The attack, peaking at **~1.2 Tbps**, was launched by the **Mirai botnet** — a network of compromised IoT devices. Twitter, Spotify, Reddit, GitHub, Netflix, Airbnb, and dozens of other major services were unreachable for hours because they all relied on Dyn for DNS resolution.

## The Chain of Events

1. The Mirai botnet — composed of hundreds of thousands of compromised IoT devices (cameras, DVRs, routers) — began flooding Dyn's DNS infrastructure
2. The first attack wave hit at ~7:00 AM EDT, overwhelming Dyn's East Coast resolvers
3. Dyn mitigated the first wave, but a **second and third wave** followed within hours
4. DNS queries for major websites timed out — browsers couldn't resolve domain names to IP addresses
5. Sites were technically up, but **unreachable** because users couldn't look them up
6. The attack exposed that dozens of high-profile services used Dyn as their **sole DNS provider**
7. Services with multi-provider DNS (e.g., using both Dyn and Route 53) were largely unaffected

## Root Cause

- IoT devices shipped with **default credentials** and no update mechanisms, making them easy botnet recruits
- Many major services used a **single DNS provider** with no failover
- DNS is a foundational layer — when it fails, everything above it fails regardless of redundancy elsewhere
- The sheer scale of the botnet (~100,000 devices) exceeded Dyn's DDoS mitigation capacity

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **DNS is a single point of failure** for the entire internet | SPOF elimination |
| Use **multi-provider DNS** (e.g., Route 53 + Cloudflare DNS) | Redundancy |
| Anycast routing distributes attack traffic across PoPs | [[02_building_blocks/cdn]] |
| IoT devices are a massive, unsecured attack surface | Security by default |
| Your uptime is only as good as your weakest dependency | Dependency risk management |

## The Key Takeaway

Your application can be perfectly designed, multi-region, and fully redundant — but if it depends on a single DNS provider, one botnet can make it disappear from the internet. DNS redundancy is not optional.

## Links
- [[02_building_blocks/dns]] — DNS architecture and resolution
- [[06_trade_offs/consistency_vs_availability]] — DNS availability under attack
