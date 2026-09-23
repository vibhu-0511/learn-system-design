#system-design #outage #security #ransomware #healthcare

# Change Healthcare Ransomware Attack (2024)

## What Happened

In February 2024, Change Healthcare (a UnitedHealth Group subsidiary) was hit by a **ransomware attack** that took down claims processing for most of the US healthcare system. The outage lasted **weeks**, exposing over 100 million patient records and costing UnitedHealth an estimated **$872 million** in direct response costs.

## The Chain of Events

1. Attackers (ALPHV/BlackCat group) gained access via a **Citrix remote access server that lacked MFA**
2. Using stolen credentials, they moved laterally through Change Healthcare's network for ~9 days
3. Attackers exfiltrated approximately 6 TB of sensitive patient data
4. Ransomware was deployed, encrypting critical systems
5. Change Healthcare shut down its entire platform to contain the spread
6. **US-wide impact:** pharmacies couldn't process prescriptions, hospitals couldn't submit claims, providers couldn't verify insurance
7. Manual workarounds (paper claims, phone calls) couldn't handle the volume
8. UnitedHealth paid a $22 million ransom but data had already been exfiltrated
9. Full restoration took over a month; some systems were rebuilt from scratch

## Root Cause

- A critical external-facing server had no multi-factor authentication
- Flat network architecture allowed lateral movement once inside the perimeter
- Change Healthcare processes ~15 billion transactions/year — a single point of failure for US healthcare
- No network segmentation to contain the blast radius of a breach
- Backup and recovery procedures were not designed for a full-infrastructure ransomware scenario

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **MFA on every external-facing service** — no exceptions | Defense in depth |
| Network segmentation limits blast radius of any breach | Fault isolation |
| A single company processing 40% of US claims is a systemic risk | Single point of failure |
| Assume breach: design for lateral movement containment | Zero trust architecture |
| Backup strategy must account for ransomware encrypting backups too | Disaster recovery |

## The Key Takeaway

One missing MFA configuration on one server led to the largest healthcare data breach in US history. When a single system is a chokepoint for an entire industry, its security posture must match its criticality — and the industry must design for that system failing.

## Links
- [[06_trade_offs/consistency_vs_availability]] — security failure caused total unavailability
- [[02_building_blocks/api_gateway]] — authentication and access control at the edge
