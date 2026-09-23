#system-design #outage #legacy-systems

# Southwest Airlines Meltdown (2022)

## What Happened

During December 2022's winter storm, Southwest Airlines cancelled **16,700+ flights** over 10 days, stranding 2M+ passengers. While other airlines recovered in 1-2 days, Southwest took 10 days. **Cost: $800M+.**

## The Chain of Events

1. Winter storm Elliott caused initial flight cancellations across all US airlines
2. Other airlines recovered within 1-2 days using modern crew scheduling systems
3. Southwest's **legacy crew scheduling system (SkySolver)** couldn't handle the cascading rebookings
4. The system required **manual phone calls** from crew to operations to report availability
5. Phone lines were overwhelmed — hold times exceeded 12 hours
6. Pilots and flight attendants were available but the system couldn't match them to flights
7. Aircraft were in the right cities but had no assigned crew
8. **The system couldn't be restarted** — required near-complete network rebuild from scratch
9. Southwest essentially had to rebuild the entire flight schedule manually

## Root Cause

- **30+ year old crew scheduling system** never modernized
- Point-to-point routing (no hubs) means one disruption cascades everywhere
- No automated crew rescheduling — required manual phone coordination
- System had a known scaling limit that was exceeded by the storm's magnitude

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Technical debt has real-world consequences** — $800M in this case | Modernization |
| **Systems must handle degraded states gracefully** | [[back_pressure]] |
| Point-to-point has no natural containment — failures cascade | Blast radius, fault isolation |
| **Automation over manual processes** at scale | System design fundamentals |
| Capacity planning must include worst-case scenarios | [[07_interview_framework/estimation_cheat_sheet]] |

## The Key Takeaway

Technical debt in critical systems is not just an engineering problem — it's a business survival problem. Southwest had been told for years that their crew system needed modernization. The cost of NOT modernizing ($800M + reputation) dwarfed the cost of doing it.

## Links
- [[03_design_patterns/circuit_breaker]] — Limit cascading failures
- [[back_pressure]] — Handle degraded states
- [[06_trade_offs/simplicity_vs_scalability]] — When to modernize
