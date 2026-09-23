#system-design #outage #deployment #global

# CrowdStrike Global Outage (2024) — The Biggest IT Outage in History

## What Happened

On July 19, 2024, a faulty CrowdStrike Falcon sensor update caused **8.5 million Windows computers worldwide to crash** with the Blue Screen of Death (BSOD). Airlines, banks, hospitals, 911 services, and businesses globally were affected. **Estimated cost: $5.4 billion+.**

## The Chain of Events

1. CrowdStrike pushed a **channel file update** (configuration update, not code) to Falcon sensor
2. The update contained a **logic error** in a content file (Channel File 291)
3. The Falcon sensor runs at **kernel level** (deepest part of Windows OS)
4. The faulty config caused the sensor to crash → kernel panic → BSOD
5. Since it crashes at boot → **infinite BSOD loop** (can't even start Windows)
6. Update was pushed to **ALL customers simultaneously** (no canary/staged rollout)
7. Fix required **manual intervention** on each machine (boot to Safe Mode, delete file)
8. With 8.5M machines and many requiring physical access → recovery took DAYS to WEEKS

## Root Cause

- Content/config update **not tested** against production scenarios
- Kernel-level software with **no staged rollout** — update went to 100% immediately
- No automatic rollback mechanism for kernel-level components
- Single faulty file bypassed all validation because it was "just a config update" (not code)

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **NEVER push to 100% at once** — canary is non-negotiable | Progressive rollout |
| Config changes are as dangerous as code changes — test them equally | Configuration management |
| Kernel-level/infrastructure components need EXTRA safety layers | Blast radius |
| Automatic rollback must be possible for every deployment | Deployment safety |
| "It's just a config update" is the most dangerous sentence in engineering | Testing discipline |
| **Manual recovery at scale is impossible** — 8.5M machines can't be fixed by hand | Automation |

## The Key Takeaway

This single incident caused more disruption than any cyberattack in history. The fix was KNOWN within hours but recovery took weeks because every machine needed manual intervention. Design your systems so that ANY update can be automatically rolled back without human touch.

## Links

- [[../10_hld/microservices_patterns]] — Canary deployments
- [[cloudflare_regex_outage_2019]] — Similar: push to 100% without canary
- [[../03_design_patterns/circuit_breaker]] — Auto-detect and rollback
