#system-design #interview #startups

# Startup Interviews — What's Different

---

## How Startup Interviews Differ

| Aspect | Startup | Big Company |
|--------|---------|-------------|
| **Rounds** | 2-3 (faster process) | 4-6 |
| **Focus** | "Can you build this?" | "Can you design this?" |
| **Practical skills** | Very high weight | Moderate |
| **System design** | Practical, pragmatic | Theoretical, at-scale |
| **Code** | Working code, maybe a take-home | Whiteboard/pseudocode |
| **Culture fit** | Very important | Important but structured |

---

## What Early-Stage Startups Ask

**HLD (Pragmatic):**
- "How would you build our product from scratch?"
- "Design this feature — we're launching in 2 weeks"
- Less about "10M users" scale, more about "ship it right"

**LLD:**
- "Walk me through how you'd structure this codebase"
- Clean architecture awareness
- API design (REST endpoints, request/response formats)

**Practical:**
- "Here's a bug in production — debug it live"
- "Review this PR — what would you change?"
- Take-home project (build a mini version in 3-4 hours)

---

## What Growth-Stage Startups Ask (Series B+)

More structured, closer to product companies:
- 1-2 system design rounds (practical scale)
- 1 LLD round
- 1-2 DSA rounds
- Culture/values round

**Key difference:** They care about SPEED of delivery alongside quality. "How fast can you ship this without creating tech debt?"

---

## Preparation for Startups

```
Focus on:
  ✓ Building real projects (portfolio matters more than Leetcode)
  ✓ API design (REST, authentication, pagination)
  ✓ Database schema design (PostgreSQL/MongoDB)
  ✓ Clean architecture (your code should be readable)
  ✓ DevOps basics (Docker, CI/CD, deployment)
  ✓ One deep technology stack (e.g., Java + Spring + PostgreSQL + Redis)

Less emphasis on:
  △ Theoretical distributed systems (CAP theorem, consensus algorithms)
  △ Extreme-scale design (designing for 1B users)
  △ Competitive programming
```

## Links

- [[../11_lld/code_architecture/clean_architecture]] — What startups value
- [[../08_reference/system_design_checklist]] — Use this for any project design
