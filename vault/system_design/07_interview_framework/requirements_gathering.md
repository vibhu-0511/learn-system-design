#system-design #interview

# Requirements Gathering

## Template Questions (Ask These Every Time)

### Functional
- "What are the core features? Let's prioritize."
- "Who uses this? (end users, internal, API consumers)"
- "What's the most important user flow?"

### Scale
- "How many users? DAU?"
- "What's the read:write ratio?"
- "How much data are we storing?"

### Non-Functional
- "What's the latency target?"
- "Consistency or availability — which matters more for this use case?"
- "Do we need real-time updates or is eventual consistency OK?"

### Constraints
- "Any existing infrastructure to integrate with?"
- "Geographic distribution of users?"
- "Compliance requirements (GDPR, HIPAA)?"

## Good vs Bad Questions

| Bad | Good |
|-----|------|
| "Should it be fast?" | "What's our P99 latency target?" |
| "Should it be reliable?" | "What's our availability target — 99.9% or 99.99%?" |
| "How many users?" | "What's the expected DAU and peak concurrent users?" |
| "What database should we use?" | "What are the access patterns and consistency requirements?" |

## Pro Tip

Don't ask more than 3-4 minutes of questions. Gather the essentials, state your assumptions, and say: "I'll assume X. Let me know if that's off."

## Links
- [[the_four_step_framework]] — Step 1
