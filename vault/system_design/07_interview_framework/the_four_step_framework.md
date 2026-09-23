#system-design #interview #framework

# The Four-Step Framework for System Design Interviews

> Use this for EVERY system design question. It works for everything from URL shorteners to Netflix.

---

## Step 1: Requirements Clarification (5 minutes)

**Never jump to a solution.** Ask questions first.

### Functional Requirements (What does it do?)
- "What are the core features we're designing?"
- "Who are the users? What actions do they take?"
- "Should we support X?" (proactively identify scope)

### Non-Functional Requirements (How well does it do it?)
- "What's the expected scale? DAU? QPS?"
- "What's the latency requirement?"
- "What's more important: consistency or availability?"
- "Any compliance/regulatory requirements?"

### What NOT to do:
- Don't ask 15 minutes of questions — keep it focused
- Don't ask questions you should know the answer to ("Should the system be fast?" — obviously yes)

---

## Step 2: Back-of-Envelope Estimation (5 minutes)

Show you think quantitatively. See [[estimation_cheat_sheet]].

**Calculate:**
- QPS (queries per second) for reads and writes
- Storage requirements (per item × number of items × retention period)
- Bandwidth (QPS × average response size)
- Number of servers needed (rough estimate)

**Template:**
```
Users: X daily active
Actions: Y per user per day
QPS: X × Y / 86400
Peak QPS: QPS × 3 (3x peak multiplier)
Storage/year: items/day × 365 × size_per_item
```

---

## Step 3: High-Level Design (15 minutes)

**This is where you spend most of your time.**

1. Define the main APIs (2-3 key endpoints)
2. Draw the architecture diagram (boxes and arrows)
3. Walk through the main use cases on the diagram
4. Identify the data model (key tables/collections)

**Standard components to consider:**
- Client → Load Balancer → API Servers → Cache → Database
- Background workers, message queues for async work
- CDN for static content
- Search engine if search is needed

**Communicate constantly:** "I'm thinking we'd put a cache here because reads are 100:1 to writes..."

---

## Step 4: Deep Dive (10 minutes)

**The interviewer will guide this.** They'll ask about 1-2 components.

Common deep-dive topics:
- Database schema and access patterns
- Specific algorithm (consistent hashing, fan-out strategy)
- Scaling a bottleneck
- Handling failure scenarios
- Data partitioning strategy

**What makes a strong deep dive:**
- Discuss trade-offs ("We could do X or Y — X is better here because...")
- Mention failure modes ("What happens if this component dies?")
- Know your numbers ("At 10K QPS, we'd need ~3 app servers")
- Bring up monitoring/observability

---

## Time Management

```
Total time: 35-45 minutes

Minutes 0-5:   Requirements + Estimation
Minutes 5-20:  High-Level Design
Minutes 20-35: Deep Dive (1-2 areas)
Last 2 min:    Wrap up, mention what you'd add with more time
```

## The Meta-Game

**What interviewers actually evaluate:**
1. Can you break down an ambiguous problem?
2. Do you make reasonable trade-offs?
3. Can you communicate your design clearly?
4. Do you think about scale, failure, and edge cases?
5. How well do you respond to hints and pushback?

**They're NOT evaluating:**
- Whether your design is "correct" (there's no single right answer)
- Whether you memorized specific technologies
- Whether you can code the solution

## Links
- [[estimation_cheat_sheet]] — Numbers for Step 2
- [[requirements_gathering]] — How to ask good questions
- [[common_red_flags]] — What to avoid
- [[signal_moments]] — What to do to stand out
