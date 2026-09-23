#system-design #outage #networking #dns

# Facebook BGP Outage (2021)

## What Happened

On October 4, 2021, Facebook, Instagram, WhatsApp, and Messenger were **completely unreachable for 6 hours**. 3.5 billion users affected. Estimated cost: $60-100 million in revenue.

## The Chain of Events

1. Engineers pushed a **BGP configuration change** during routine maintenance
2. The change accidentally **withdrew all BGP routes** to Facebook's DNS servers
3. Facebook's DNS nameservers became unreachable from the entire internet
4. Without DNS: `facebook.com` → ??? No IP address found
5. Every Facebook property disappeared simultaneously
6. Engineers couldn't fix it remotely — their internal tools also relied on the same DNS
7. Engineers had to **physically go to the data center** to fix it
8. Physical access controls also had issues (badges relied on Facebook systems)
9. Took 6 hours to restore

## Root Cause

- BGP (Border Gateway Protocol) misconfiguration withdrew all Facebook routes
- DNS was a single point of failure — all services depended on it
- Internal tools depended on the same infrastructure as external services
- Physical access to data centers was also dependent on affected systems
- No "break glass" procedure that was independent of the primary infrastructure

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **DNS is a critical SPOF** | [[01_fundamentals/networking_basics]] |
| Out-of-band management must be truly independent | Blast radius |
| Test configuration changes in staging | Deployment safety |
| BGP changes should be gradual (canary) | Progressive rollout |
| Physical access shouldn't depend on digital systems | Operational planning |

## The Key Takeaway

Your recovery path cannot depend on the thing that's broken. Always have an out-of-band recovery mechanism that is completely independent.

## Links
- [[01_fundamentals/networking_basics]] — DNS and BGP
- [[02_building_blocks/monitoring_and_logging]] — Out-of-band monitoring
