#system-design #interview

# Common Red Flags (What Tanks Your Interview)

---

### 1. Jumping to Solution
**Bad:** "So for Twitter I'd use Kafka and Cassandra and—"
**Good:** "Before I start, let me clarify the requirements and estimate the scale."

### 2. Single Point of Failure
Forgetting redundancy for critical components. Every component should have: "What happens if this dies?"

### 3. Ignoring Trade-offs
**Bad:** "We'll use Cassandra" (no explanation)
**Good:** "We'll use Cassandra for the timeline because we need high write throughput and can accept eventual consistency"

### 4. Over-Engineering
Designing for Google scale when the problem is 1,000 users. Start simple, scale incrementally.

### 5. No Numbers
Not doing back-of-envelope estimation. Interviewers want to see quantitative thinking.

### 6. Not Considering Failure
Never mentioning: What if the database goes down? What if a request fails? What about retries?

### 7. Monologue Mode
Talking for 10 minutes straight without checking in. System design is a **conversation**. Pause, ask "Does this direction make sense?"

### 8. Buzzword Dropping
Naming technologies without understanding why. "We'll use Kubernetes and Kafka and Redis and..." — WHY?

### 9. Ignoring the Interviewer's Hints
If they say "What about the write path?" — they're telling you to go deeper there. Follow their lead.

### 10. Not Finishing
Running out of time before covering the full design. Manage your time with the [[the_four_step_framework]].

## Links
- [[signal_moments]] — The opposite: what to do to stand out
- [[the_four_step_framework]] — Structure prevents most red flags
