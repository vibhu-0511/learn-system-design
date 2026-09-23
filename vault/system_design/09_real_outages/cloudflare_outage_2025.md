#system-design #outage #configuration #edge-computing #rust

# Cloudflare Outage (2025)

## What Happened

On November 1, 2025, Cloudflare suffered a **~20-minute global outage** affecting nearly all of its services. A bot-management feature configuration file exceeded a hard-coded **32 MB size limit** in their Rust-based edge proxy, causing the proxy to panic and crash across their entire edge network.

## The Chain of Events

1. The bot-management team updated a configuration file used by the edge proxy
2. Over time, this file had grown incrementally as new rules and signatures were added
3. The update pushed the file past a **hard-coded 32 MB limit** in the Rust proxy's deserialization code
4. The proxy **panicked** (Rust's equivalent of a crash) when it tried to load the oversized config
5. The panic propagated globally — every edge node attempted to load the same config
6. With edge proxies down, **all Cloudflare services** (CDN, DNS, Workers, Zero Trust, etc.) were unreachable
7. Engineers identified the root cause and rolled back the configuration within ~20 minutes

## Root Cause

- A **hard-coded size limit** (32 MB) existed in the proxy's config deserialization path
- No validation or alerting existed to warn when config files approached the limit
- The config file grew gradually over months — no one tracked its size trajectory
- The change was not canaried; it deployed globally at once

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Never assume static configs stay small** — data grows over time | Capacity planning |
| Add size checks and alerts before hard limits are hit | Defensive programming |
| **Canary config changes** just like code deployments | Progressive rollout |
| A single panic in a shared-nothing architecture can still be global | Fault isolation |
| Rust's panic-on-error can be dangerous if not caught at boundaries | Error handling strategy |

## The Key Takeaway

Configuration is code. If you deploy code with canaries and rollback, your config changes deserve the same discipline — especially when a single bad config can crash every edge node simultaneously.

## Links
- [[06_trade_offs/consistency_vs_availability]] — global config sync traded partition tolerance for consistency
- [[02_building_blocks/cdn]] — CDN architecture and edge proxy design
