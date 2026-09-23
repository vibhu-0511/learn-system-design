#system-design #hld #framework #thinking

# HLD Thinking System — How Architects Actually Think

## Intuition (30 sec)

You don't design a house by picking furniture first. You start with: How many people live here? What's the climate? What's the budget? The constraints TELL you what kind of house to build. HLD works the same way.

## Failure-First Scenario

> A junior engineer gets asked "Design Instagram." They immediately draw: Load Balancer → App Server → Database → Cache. Looks reasonable. Interviewer asks: "Why these components? Why not event-driven? Why SQL over NoSQL?" Silence. They drew a template, not a design. They can't defend any decision because they didn't THINK through the constraints.

---

## The Constraints-First Method

**Don't start with components. Start with forces acting on the system.**

### Step 1: Identify the Constraints

Ask these questions about EVERY system:

```
SCALE:        How many users? QPS? Data volume?
LATENCY:      What response time is acceptable?
CONSISTENCY:  Can we tolerate stale data? Where?
AVAILABILITY: Can we tolerate downtime? How much?
DURABILITY:   Can we lose data? What's the cost of data loss?
COST:         Are we optimizing for speed-to-market or efficiency?
TEAM:         How many engineers? What do they know?
```

### Step 2: Let Constraints Drive Decisions

Each constraint DICTATES architecture choices:

| Constraint | Implication |
|-----------|-------------|
| Read-heavy (100:1 ratio) | Caching layer, read replicas, CDN |
| Write-heavy (50K writes/sec) | Message queue, async processing, write-optimized DB |
| Strong consistency needed | ACID database, synchronous writes, no cache for critical data |
| Global users | Multi-region, CDN, edge computing |
| Real-time features | WebSocket, pub/sub, event-driven architecture |
| Complex business rules | Rich domain model, separate service, CQRS |
| Cost-sensitive | Serverless, auto-scaling, storage tiering |
| Small team | Monolith, managed services, simple architecture |

### Step 3: The Architect's Playback

Narrate your thinking OUT LOUD. This is what interviewers want to hear:

> "I notice this system is read-heavy — users browse 100x more than they post. So caching is critical. But likes and comments need to feel instant, so I need a fast write path too. I'll use a write-behind cache for counters and an event-driven pipeline for the feed. The feed itself can be eventually consistent — a 2-second delay is fine for social media..."

This inner monologue IS the design process. The diagram comes after.

---

## The HLD Pipeline

```mermaid
graph LR
    R[Requirements] --> C[Constraints]
    C --> D[Key Decisions]
    D --> A[Architecture]
    A --> V[Validate & Stress Test]
```

### 1. Requirements → What are we building?
- Functional: features, user flows
- Non-functional: scale, latency, consistency, availability

### 2. Constraints → What forces shape the design?
- The constraint analysis above
- Identify the TOP 3 constraints (not all are equal)

### 3. Key Decisions → What are the critical choices?
- Sync vs async communication
- SQL vs NoSQL (which data stores)
- Monolith vs microservices
- Push vs pull for data delivery
- Where to put the consistency boundary

### 4. Architecture → Draw the system
- Components and their responsibilities
- Data flow between components
- API contracts (high-level)
- Data model (high-level)

### 5. Validate → Stress test the design
- Walk through key user flows on the diagram
- Ask "what if this fails?"
- Ask "what if traffic 10x?"
- Ask "what if requirements change?"

---

## Common HLD Mistakes

| Mistake | Fix |
|---------|-----|
| Drawing components before understanding requirements | Constraints first, components second |
| "We'll use Kafka" without saying why | Every technology choice needs a reason |
| Not identifying the core challenge | Every system has ONE hard problem — find it |
| Designing for Google scale on day 1 | Start simple, show scaling path |
| Ignoring the data model | Data model drives everything — define it early |
| Not discussing failure modes | "What happens when X goes down?" for every component |

## The Core Challenge Pattern

Every system has ONE core challenge. Find it early:

| System | Core Challenge |
|--------|---------------|
| Twitter | Fan-out problem (delivering tweets to followers) |
| Uber | Real-time geospatial matching |
| WhatsApp | Persistent connections at massive scale |
| YouTube | Video processing pipeline + CDN delivery |
| Stripe | Distributed transaction consistency |
| Google Docs | Real-time collaborative conflict resolution |

Name the core challenge in the first 2 minutes. Everything else is supporting infrastructure.

## Interview Tips

- Spend 30 seconds thinking silently before speaking — shows you're processing, not panicking
- State your top 3 constraints explicitly: "The key forces here are X, Y, Z"
- Use the architect's playback — narrate your decisions as you make them
- Draw the data flow first, then add components around it

## Links

- [[problem_taxonomy_hld]] — Recognize the problem type
- [[architecture_decision_records]] — Document each decision formally
- [[hld_review_checklist]] — Validate your design before presenting
- [[07_interview_framework/the_four_step_framework]] — Interview-specific framework
