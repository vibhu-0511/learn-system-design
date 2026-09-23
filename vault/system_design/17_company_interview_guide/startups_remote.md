# Startups & Remote Companies — System Design Interview Guide

> **Navigation:** [[17_company_interview_guide/index]] | [[07_interview_framework/the_four_step_framework]]
>
> Startups and remote-first companies evaluate system design fundamentally differently
> from Big Tech. They want **pragmatic, cost-aware, production-ready** thinking — not
> theoretical designs for billions of users. This guide covers what matters.

---

## 1. Company Overview & Categories

### 1.1 Well-Funded Indian Startups (Series B–D)

| Company | Domain | Stage | Eng Team Size | Key Tech |
|---------|--------|-------|---------------|----------|
| **Meesho** | Social commerce | Late stage | 400–600 | Java, Kotlin, AWS, Kafka |
| **Urban Company** | Home services marketplace | Late stage | 300–500 | Node.js, Go, AWS, MongoDB |
| **Zepto** | Quick commerce (10-min delivery) | Growth | 200–400 | Python, Go, AWS, Redis |
| **Razorpay** (startup stage) | Payments infrastructure | Late stage | 500–800 | Go, Ruby, AWS, Kafka |
| **CRED** | Fintech / rewards | Late stage | 300–500 | Java, Kotlin, AWS |
| **PhonePe** (pre-IPO) | Digital payments | Late stage | 1000+ | Java, Spring Boot, Kafka |

**Compensation (India, 2025–2026):**
- SDE-2 (3–5 YOE): 30–55 LPA base + ESOPs (can be 10–40 LPA on paper)
- SDE-3 / Senior (5–8 YOE): 50–85 LPA base + significant ESOPs
- Staff / Principal (8+ YOE): 80–1.2 Cr base + ESOPs
- ESOPs are a gamble — ask about liquidation events, 409A valuation, cliff, vesting

### 1.2 Global Remote-First Companies

| Company | Domain | HQ | Remote Model | Key Tech |
|---------|--------|----|-------------|----------|
| **GitLab** | DevOps platform | All-remote | Fully async, 65+ countries | Ruby, Go, Vue.js, GCP |
| **Automattic** | WordPress/Tumblr | Distributed | Fully remote since founding | PHP, JavaScript, WordPress |
| **Postman** | API platform | Bangalore/SF | Hybrid-remote | Node.js, Go, Electron |
| **Basecamp** | Project management | Remote-first | Small team, remote-first | Ruby on Rails, Hotwire |

**Compensation (Remote Global, USD):**
- GitLab: Location-factored pay — SF benchmark * location factor (0.5–1.0)
  - Senior Engineer: $120K–$180K (US), $60K–$100K (India)
- Automattic: Competitive global pay, not heavily location-adjusted
  - Senior Engineer: $130K–$170K globally
- Postman: India-first pay scales, competitive for Indian market
  - SDE-2: 35–55 LPA; SDE-3: 55–90 LPA
- Basecamp: Standardized pay regardless of location
  - Senior Programmer: ~$180K–$210K (same everywhere)

### 1.3 Developer Tools / SaaS (Global)

| Company | Domain | Stage | Remote? | Key Tech |
|---------|--------|-------|---------|----------|
| **Notion** | Productivity / docs | Late stage | Hybrid (SF) | Kotlin, TypeScript, AWS |
| **Figma** | Design tools | Acquired (Adobe fell through) | Hybrid | C++, TypeScript, WebAssembly |
| **Vercel** | Frontend platform / Next.js | Series D | Remote-first | TypeScript, Go, AWS/Edge |
| **Supabase** | Open-source Firebase | Series C | Fully remote | Elixir, PostgreSQL, TypeScript |
| **Hashicorp** | Infrastructure tools | Public | Remote-friendly | Go, primarily |
| **PlanetScale** | Serverless MySQL | Series C | Remote-first | Go, Vitess, MySQL |

**Compensation (USD):**
- Notion: $160K–$220K base + equity (US), $80K–$120K (India)
- Figma: $170K–$250K total comp (US)
- Vercel: $150K–$200K base (US), location-adjusted for others
- Supabase: Competitive for remote, $120K–$180K range

---

## 2. Interview Process

### 2.1 Typical Startup Flow (5–8 YOE Roles)

```
Week 1              Week 2              Week 3              Week 4
┌─────────┐   ┌──────────────┐   ┌────────────┐   ┌─────────────┐
│Recruiter │──▶│ Take-Home OR │──▶│  Technical  │──▶│ Founder/CTO │
│  Screen  │   │  Live Coding │   │   Rounds    │   │   Round     │
│ (30 min) │   │  (24-72 hrs) │   │ (2-3 rounds)│   │  (30-45 min)│
└─────────┘   └──────────────┘   └────────────┘   └─────────────┘
                                       │
                              ┌────────┴────────┐
                              │                 │
                         System Design    Cultural Fit /
                          (45-60 min)     Bar Raiser
```

### 2.2 Remote Company Flow (GitLab, Automattic, Supabase)

```
Async Phase                    Sync Phase
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐
│  Application │──▶│  Take-Home   │──▶│ Technical    │──▶│ Team Fit │
│  + Written   │   │  Assignment  │   │ Discussion   │   │ / Values │
│  Questions   │   │  (48-72 hrs) │   │ (Video call) │   │  Round   │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────┘
     │                    │
     ▼                    ▼
  GitLab: Answer      Automattic: Trial
  written Qs in        project (2-4 weeks,
  merge request        PAID, $2500-5000)
```

**Key differences from Big Tech:**
- No LeetCode grind in most cases (some Indian startups still do DSA rounds)
- Take-home is very common — especially at remote companies
- System design round is more practical: "How would you build this for our scale?"
- Cultural fit / values alignment carries significant weight
- Founder round is common at Series B–C — they want to meet you personally
- Total process: 2–4 weeks (vs 4–8 weeks at FAANG)

### 2.3 What Each Round Tests

| Round | Duration | What They Evaluate |
|-------|----------|--------------------|
| Take-Home | 24–72 hrs | Code quality, testing, docs, pragmatism |
| System Design | 45–60 min | Architecture sense, cost awareness, trade-offs |
| Technical Discussion | 45–60 min | Depth in your stack, debugging, production experience |
| Cultural Fit | 30–45 min | Async communication, ownership, documentation habits |
| Founder/CTO | 30–45 min | Vision alignment, ambition, "can I work with this person?" |

---

## 3. System Design Round — What Startups Actually Want

### 3.1 Startup Mindset vs Big Tech Mindset

```
Big Tech Thinking (AVOID)              Startup Thinking (DO THIS)
─────────────────────────              ──────────────────────────
"Let's design for 1B users"     →     "We have 50K DAU, growing 20%/month"
"Custom distributed DB"         →     "PostgreSQL on RDS, maybe shard later"
"Build our own cache layer"     →     "Redis on ElastiCache, done"
"Kubernetes with service mesh"  →     "ECS Fargate or even a monolith"
"Eventually consistent CRDT"    →     "Strong consistency, keep it simple"
"Custom load balancer"          →     "ALB + Route53, move on"
"Design for infinite scale"     →     "Design for 10x current, plan for 100x"
```

### 3.2 The Startup Evaluation Rubric

Interviewers at startups score you on different axes:

| Criteria | Weight | What They Want to See |
|----------|--------|-----------------------|
| **Pragmatism** | 25% | Choose boring technology that works, not shiny new tools |
| **Cost Awareness** | 20% | Know what things cost on AWS/GCP, optimize spend |
| **Speed to Ship** | 20% | MVP-first, iterate, don't over-engineer day-1 |
| **Production Readiness** | 15% | Monitoring, alerting, error handling, graceful degradation |
| **Scalability Plan** | 10% | Show you know HOW to scale, but don't build it now |
| **Communication** | 10% | Clear thinking, structured approach, good trade-off discussion |

### 3.3 The Magic Phrase Framework

When discussing any design decision at a startup interview, use this structure:

> "For our current scale of X, I'd use [simple solution]. This costs roughly $Y/month.
> When we hit [trigger metric], we'd migrate to [complex solution]. The migration path
> would be [brief description]."

This shows you can be pragmatic NOW while thinking about the FUTURE.

### 3.4 Cost Awareness Cheat Sheet

Reference [[08_reference/latency_numbers]] for performance context. Here are costs:

| Service | Rough Monthly Cost | When to Use |
|---------|--------------------|-------------|
| RDS PostgreSQL (db.r6g.large) | $150–200 | Default DB choice up to ~1TB |
| ElastiCache Redis (r6g.large) | $150–180 | Caching, sessions, rate limiting |
| ALB | $20 + traffic | Always, for any web service |
| ECS Fargate (2 vCPU, 4GB) | $70–90/task | Containerized services |
| Lambda (1M invocations) | $0.20 + compute | Event-driven, sporadic workloads |
| S3 (1TB storage) | $23 | File storage, always |
| CloudFront (10TB transfer) | $850 | CDN, static assets |
| SQS (1M messages) | $0.40 | Async processing, decoupling |
| Kafka (MSK, 3 brokers) | $600–900 | Only when you NEED streaming |
| NAT Gateway (per GB) | $0.045/GB | Careful — this adds up fast |

**Indian startup cost context:**
- Early-stage Indian startup monthly AWS bill: $5K–$20K
- Growth stage (Meesho, Zepto scale): $100K–$500K/month
- Razorpay / PhonePe scale: $500K–$2M/month
- Always mention cost when proposing infrastructure

---

## 4. Top 10 Common Questions

### Q1: Design the Company's Core Product

This is the most common question. Research what the company does and prepare:
- **Zepto:** Design a 10-minute grocery delivery system (real-time tracking, dark stores)
- **Meesho:** Design a social commerce platform (reseller network, catalog, orders)
- **Urban Company:** Design a home services marketplace (provider matching, scheduling)
- **GitLab:** Design a CI/CD pipeline (see Q7 below)
- **Notion:** Design a collaborative document editor
- **Vercel:** Design a serverless deployment platform
- **Supabase:** Design a real-time database API layer

**Always research the company's product before the interview.**

### Q2: Design a Notification System
→ See [[05_case_studies/design_notification_system]]

Startup twist: Focus on multi-channel (push, SMS, email, WhatsApp in India), cost per
notification, batching to reduce costs, user preferences, and avoiding notification fatigue.

### Q3: Design an API Rate Limiter
→ See [[05_case_studies/design_rate_limiter]]

Startup twist: Protect your API from abuse without expensive infrastructure. Token bucket
in Redis is the pragmatic answer. See [[02_building_blocks/caching]] for Redis patterns.

### Q4: Design a URL Shortener
→ See [[05_case_studies/design_url_shortener]]

Often used as a warm-up or take-home. Show analytics tracking, custom domains,
expiration policies. Reference [[05_case_studies/design_pastebin]] for similar patterns.

### Q5: Design a Chat System
→ See [[05_case_studies/design_chat_system]]

Common at companies building customer support tools or in-app messaging.
WebSocket connections, message queuing with [[02_building_blocks/message_queues]].

### Q6: Design a Logging/Monitoring Pipeline
→ See [[05_case_studies/design_logging_system]]

Every startup needs observability. Show ELK stack or Loki + Grafana, structured logging,
alerting thresholds, cost-effective log retention strategies.

### Q7: Design a CI/CD Pipeline

Very common at DevOps-focused companies (GitLab, Vercel, Supabase).
See [[15_intermediate_topics/docker_and_kubernetes]] for container context.

Key components: Source control hooks, build queue, artifact storage, test runners,
deployment strategies (blue-green, canary), rollback mechanisms.

### Q8: Design a Feature Flag System
→ Full walkthrough in Section 8 below.

### Q9: Design a Multi-Tenant SaaS Backend

Common at B2B startups. Key decisions: shared DB vs DB-per-tenant, tenant isolation,
noisy neighbor prevention, billing per tenant. See [[15_intermediate_topics/cloud_architecture_patterns]].

### Q10: Design an Event-Driven Architecture

Show understanding of [[02_building_blocks/message_queues]], event sourcing vs event
notification, dead letter queues, idempotency, exactly-once semantics (and why it's hard).

---

## 5. Startup-Specific Design Patterns

### 5.1 MVP-First Architecture

```
Phase 1: MVP (0–10K users)          Phase 2: Growth (10K–500K users)
┌──────────────────────────┐        ┌──────────────────────────────────┐
│      Single Server        │        │          Load Balancer           │
│  ┌────────────────────┐  │        │  ┌─────────┐   ┌─────────┐     │
│  │   Monolith App     │  │        │  │ Service  │   │ Service │     │
│  │  (Rails/Django/    │  │   →    │  │   A      │   │   B     │     │
│  │   Express)         │  │        │  └────┬─────┘   └────┬────┘     │
│  └────────┬───────────┘  │        │       │              │          │
│           │              │        │  ┌────┴──────────────┴────┐     │
│  ┌────────┴───────────┐  │        │  │   PostgreSQL (RDS)     │     │
│  │  PostgreSQL + Redis│  │        │  │   + Redis + SQS        │     │
│  └────────────────────┘  │        │  └────────────────────────┘     │
└──────────────────────────┘        └──────────────────────────────────┘
    AWS bill: $200/month                AWS bill: $2,000–5,000/month
```

**What to say in interviews:**
- "Start with a well-structured monolith. Extract services only when there's a clear
  boundary and a scaling reason."
- "PostgreSQL handles 90% of use cases up to significant scale."
- "Premature microservices are a startup killer."

### 5.2 Managed Services Over Self-Hosted

| Need | Self-Hosted (Avoid) | Managed (Prefer) | Why |
|------|--------------------|--------------------|-----|
| Database | PostgreSQL on EC2 | RDS / Aurora | Backups, failover, patching |
| Cache | Redis on EC2 | ElastiCache | HA, maintenance |
| Search | Elasticsearch cluster | OpenSearch Service | Operational burden |
| Queues | RabbitMQ on EC2 | SQS / SNS | Zero ops |
| Monitoring | Prometheus + Grafana | Datadog / CloudWatch | Focus on product |
| Auth | Roll your own | Auth0 / Clerk / Supabase Auth | Security risk |

**The startup interview golden rule:** Every hour your engineers spend on infrastructure
is an hour NOT spent on product. Managed services buy time.

### 5.3 Serverless Where Appropriate

Use serverless for:
- Webhook handlers (Lambda + API Gateway)
- Image/video processing (Lambda + S3 triggers)
- Scheduled jobs (EventBridge + Lambda)
- Low-traffic internal tools (Lambda or Vercel serverless functions)

Avoid serverless for:
- High-throughput APIs (cold starts, cost at scale)
- Long-running processes (Lambda 15-min timeout)
- Stateful workloads (WebSockets, persistent connections)
- Latency-critical paths

### 5.4 Deployment Strategies

Reference [[15_intermediate_topics/docker_and_kubernetes]] for container context.

```
Blue-Green Deployment (Preferred for startups)
──────────────────────────────────────────────
  Traffic ──▶ ALB ──▶ [Blue: v1.2 (current)]
                   ──▶ [Green: v1.3 (new)] ← deploy here, test, then switch

Canary Deployment (For larger startups)
───────────────────────────────────────
  Traffic ──▶ ALB ──▶ 95% → [v1.2]
                   ──▶  5% → [v1.3] ← monitor metrics, gradually increase

Rolling Deployment (Simple, default for ECS/K8s)
─────────────────────────────────────────────────
  [v1.2] [v1.2] [v1.2] [v1.2]
  [v1.3] [v1.2] [v1.2] [v1.2]  ← one at a time
  [v1.3] [v1.3] [v1.2] [v1.2]
  [v1.3] [v1.3] [v1.3] [v1.3]  ← done
```

### 5.5 Monitoring from Day 1

Startups that don't monitor from the start regret it. Show you know this:

```
Minimum Viable Monitoring Stack
────────────────────────────────
1. Application Logs    → CloudWatch Logs or Loki (structured JSON)
2. Metrics             → CloudWatch Metrics or Prometheus
3. Error Tracking      → Sentry ($26/month for teams)
4. Uptime Monitoring   → Better Uptime or Pingdom
5. Alerts              → PagerDuty or OpsGenie (Slack integration)
6. APM (if budget)     → Datadog or New Relic

Cost: $200–500/month for a solid monitoring setup
```

### 5.6 The Circuit Breaker Pattern

See [[03_design_patterns/circuit_breaker]] for details. Especially important at startups
where one failing dependency can bring everything down.

### 5.7 API Gateway Patterns

See [[02_building_blocks/api_gateway]]. At startup scale, use AWS API Gateway or Kong.
Don't build your own gateway unless you are a gateway company.

---

## 6. Remote Company-Specific Patterns

### 6.1 Async-First Communication

Remote companies like GitLab and Automattic heavily evaluate your ability to work
asynchronously. This affects system design discussions:

**What they want to hear:**
- "This design decision should be documented in an ADR (Architecture Decision Record)"
- "The API contract should be defined upfront so teams in different timezones can work
  independently"
- "We should use event-driven patterns so services are decoupled and teams don't block
  each other"

### 6.2 Documentation-First Culture

GitLab's entire company runs on their public handbook. When interviewing at remote
companies, demonstrate documentation habits:

- Write clear API specifications before coding
- Document architecture decisions and WHY you made them
- Create runbooks for operational procedures
- Treat documentation as a first-class deliverable, not an afterthought

### 6.3 Timezone-Aware Design

```
Design Consideration              Solution
────────────────────              ────────
Deploys across timezones    →    Automated CI/CD, no manual deploy gates
On-call coverage            →    Follow-the-sun rotation
Data consistency windows    →    Async replication with clear SLAs
Meeting-free design reviews →    PR-based reviews with 24-hour SLA
Incident response           →    Automated runbooks, clear escalation paths
```

### 6.4 Remote Company Technical Values

| Company | Core Technical Value | Show This in Interviews |
|---------|---------------------|------------------------|
| **GitLab** | Iteration, transparency, boring solutions | Small incremental changes, MR-driven |
| **Automattic** | Simplicity, WordPress ecosystem | PHP is fine, monolith is fine |
| **Basecamp** | Shape Up methodology, small teams | Fixed-time appetites, not estimates |
| **Vercel** | Developer experience, edge computing | Think about DX, serverless-first |
| **Supabase** | Open source, PostgreSQL-first | Everything built on Postgres |
| **Postman** | API-first development | Design the API contract before anything |

---

## 7. Take-Home Assignment Guide

### 7.1 What They Send You

Typical take-home assignments:

- **Backend:** Build a REST/GraphQL API with specific requirements (48–72 hours)
- **Full-stack:** Build a small feature end-to-end (48–72 hours)
- **System Design Doc:** Write a design document for a system (24–48 hours)
- **Automattic Trial:** Work on a real project for 2–4 weeks (paid)

### 7.2 The Winning Structure

```
your-assignment/
├── README.md                 ← CRITICAL: This is evaluated first
│   ├── Setup instructions (one command to run)
│   ├── Architecture overview with diagram
│   ├── Trade-offs & decisions made
│   ├── What you'd do with more time
│   └── API documentation
├── src/
│   ├── well-structured code
│   └── clear separation of concerns
├── tests/
│   ├── unit tests
│   └── integration tests (at least a few)
├── docker-compose.yml        ← One command to run everything
├── .env.example              ← Never commit real secrets
└── Makefile or scripts/      ← make run, make test, make lint
```

### 7.3 What They Evaluate (In Order)

1. **Does it work?** — If it doesn't run, you're immediately rejected
2. **README quality** — Clear, concise, shows thinking process
3. **Code organization** — Clean structure, separation of concerns
4. **Error handling** — Edge cases, validation, graceful failures
5. **Testing** — At least unit tests; integration tests are a bonus
6. **API design** — RESTful conventions, proper status codes, validation
7. **Trade-off awareness** — Document what you chose and why
8. **Production readiness** — Logging, health checks, Docker support

### 7.4 Common Mistakes (That Get You Rejected)

```
MISTAKE                              FIX
───────                              ───
No README or sparse README      →    Spend 30 min writing a great README
No tests                        →    At least 70% coverage on core logic
Over-engineering                →    YAGNI — build what's asked, document what's next
No error handling               →    Validate inputs, handle DB errors, return proper codes
Committed .env / secrets        →    Use .env.example, add .env to .gitignore
Can't run with one command      →    Docker Compose or clear 3-step setup
No input validation             →    Validate everything at the API boundary
Inconsistent code style         →    Use a linter (ESLint, rubocop, black)
```

### 7.5 Time Management

```
72-hour assignment, recommended time allocation:
────────────────────────────────────────────────
Hour 0-1:    Read requirements, plan architecture, set up project
Hour 1-4:    Build core functionality (MVP that works)
Hour 4-6:    Add error handling, validation, edge cases
Hour 6-8:    Write tests
Hour 8-9:    Write README, document trade-offs
Hour 9-10:   Polish, lint, verify it runs from scratch in Docker
             (clone fresh, docker-compose up, verify)

Total active time: ~10 hours over 3 days. Don't spend 30 hours.
```

---

## 8. Sample Walkthrough: Design a Feature Flag System

This is a common startup interview question because every growing startup needs feature
flags. Here is how to walk through it using [[07_interview_framework/the_four_step_framework]].

### Step 1: Requirements & Scope (5 minutes)

**Clarifying questions to ask:**
- How many feature flags? (Probably 50–500 active at any time)
- How many services consume flags? (10–50 microservices)
- What targeting rules? (User ID, percentage rollout, geography, user attributes)
- Latency requirement? (Flag evaluation must be < 5ms, shouldn't slow down requests)
- Who manages flags? (Engineering + Product via dashboard)

**Functional Requirements:**
- Create, update, delete feature flags via API/dashboard
- Evaluate flags for a given user context (user_id, attributes)
- Support targeting rules: percentage rollout, user segments, allowlists
- Audit log of all flag changes

**Non-Functional Requirements:**
- Flag evaluation latency < 5ms (P99)
- 99.9% availability (flags down = features broken)
- Handle 10K flag evaluations/second (current), plan for 100K/sec
- Graceful degradation: if flag service is down, use cached defaults

### Step 2: High-Level Design (10 minutes)

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Admin Dashboard│────▶│   Flag Service   │────▶│   PostgreSQL     │
│   (React app)   │     │   (API server)   │     │   (flag configs) │
└─────────────────┘     └────────┬─────────┘     └──────────────────┘
                                 │
                          ┌──────┴──────┐
                          │             │
                     ┌────▼────┐   ┌────▼────┐
                     │  Redis  │   │   SNS/  │
                     │ (cache) │   │  SQS    │
                     └────┬────┘   └────┬────┘
                          │             │
                    ┌─────▼─────────────▼──────┐
                    │    SDK (embedded in       │
                    │    each microservice)     │
                    │                          │
                    │  Local cache (in-memory) │
                    │  + periodic sync         │
                    └──────────────────────────┘
```

**Key design decision:** Flag evaluation happens locally in an embedded SDK with an
in-memory cache, NOT via network call for every evaluation. This is how LaunchDarkly,
Unleash, and Flagsmith work.

### Step 3: Deep Dive (20 minutes)

**Data Model:**
```sql
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,     -- 'new-checkout-flow'
    description TEXT,
    enabled BOOLEAN DEFAULT false,         -- global kill switch
    targeting_rules JSONB,                 -- flexible rule engine
    default_value JSONB,                   -- fallback value
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE flag_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id UUID REFERENCES feature_flags(id),
    action VARCHAR(50),                    -- 'created', 'updated', 'deleted'
    old_value JSONB,
    new_value JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP DEFAULT NOW()
);
```

**Targeting Rules (JSONB structure):**
```json
{
  "rules": [
    {
      "type": "percentage",
      "value": 25,
      "hash_key": "user_id"
    },
    {
      "type": "allowlist",
      "user_ids": ["user_123", "user_456"]
    },
    {
      "type": "attribute",
      "attribute": "country",
      "operator": "in",
      "values": ["IN", "US"]
    }
  ],
  "default": false
}
```

**SDK Design (the key insight):**
```python
class FeatureFlagClient:
    def __init__(self, api_url, api_key, sync_interval=30):
        self.cache = {}           # in-memory flag cache
        self.api_url = api_url
        self.sync_interval = sync_interval
        self._start_background_sync()

    def evaluate(self, flag_key, user_context, default=False):
        """Evaluate a flag — always fast, uses local cache."""
        flag = self.cache.get(flag_key)
        if flag is None:
            return default  # graceful degradation
        if not flag['enabled']:
            return False
        return self._evaluate_rules(flag['targeting_rules'], user_context)

    def _start_background_sync(self):
        """Poll server every N seconds for flag updates."""
        # In production: use SSE or WebSocket for real-time updates
        # Polling is the pragmatic starting point
        threading.Timer(self.sync_interval, self._sync).start()

    def _sync(self):
        """Fetch all flags from server, update local cache."""
        try:
            flags = requests.get(f"{self.api_url}/flags").json()
            self.cache = {f['key']: f for f in flags}
        except Exception:
            pass  # keep stale cache, log error
```

**Why this architecture works for startups:**
- Flag evaluation is < 1ms (in-memory lookup)
- Service stays functional even if flag server is down (stale cache)
- PostgreSQL is the only database needed (no Redis required at first)
- Simple to operate: one API server, one database
- Cost: ~$200/month (one small RDS instance, one ECS task)

### Step 4: Trade-offs & Extensions (5 minutes)

**Trade-offs made:**
- Polling vs SSE: Polling is simpler but flag changes take up to 30 seconds to propagate.
  Acceptable for most use cases. Upgrade to SSE when real-time matters.
- JSONB for rules vs separate tables: JSONB is simpler to query and evolve. Separate
  tables give better query performance for complex targeting.
- Single region: For an Indian startup, start with Mumbai region. Add replication later.

**Scaling plan (when needed):**
- 100K+ evaluations/sec: SDK handles this locally, no server changes needed
- 10K+ flags: Add Redis as a cache layer between API and PostgreSQL
- Multi-region: Replicate PostgreSQL to other regions, use regional API endpoints
- Real-time updates: Migrate from polling to SSE or WebSocket connections

**Cost estimate:**
- Current scale (50 flags, 20 services): ~$200/month
- Growth scale (500 flags, 100 services): ~$500/month
- Note: LaunchDarkly costs $10K+/month at scale — building in-house saves money

Use [[07_interview_framework/estimation_cheat_sheet]] for back-of-envelope calculations.

---

## 9. Red Flags & Green Flags

### 9.1 Red Flags (What Gets You Rejected)

**In System Design:**
- Jumping straight to microservices for a startup with 5 engineers
- Proposing Kafka when SQS would work fine
- Not mentioning cost at all during the discussion
- Designing for 1 billion users when the company has 50,000
- Not knowing what managed services are available on AWS/GCP
- Building custom solutions for solved problems (auth, payments, email)
- No mention of monitoring, alerting, or operational concerns
- Ignoring failure modes and error handling

**In Take-Home:**
- Submitting without tests
- Code doesn't run out of the box
- No README or documentation
- Over-engineering a simple problem
- Ignoring the specific requirements given
- Copy-pasting from tutorials without understanding

**In Cultural Fit (Remote Companies):**
- Saying you prefer real-time meetings over async communication
- Not valuing documentation
- Needing constant supervision or direction
- No experience with remote collaboration tools
- Inability to write clearly and concisely

### 9.2 Green Flags (What Gets You Hired)

**In System Design:**
- "For our current scale, I'd start with X. Here's the migration path to Y when we grow."
- Mentioning specific AWS/GCP costs
- Discussing build vs buy decisions pragmatically
- Showing you understand the company's domain
- Bringing up monitoring and alerting unprompted
- Discussing graceful degradation and failure modes
- Using [[03_design_patterns/circuit_breaker]] where appropriate

**In Take-Home:**
- Clean README with architecture diagram
- Docker Compose for one-command setup
- Meaningful tests with good coverage
- Clear trade-off documentation
- "Here's what I'd do with more time" section

**In Cultural Fit (Remote Companies):**
- Examples of async collaboration and written communication
- Experience with PR-based code review culture
- Self-directed work examples
- Documentation you've written proactively

---

## 10. Preparation Checklist

### 10.1 Before Applying

- [ ] Research the company's product deeply — use it if possible
- [ ] Read the company's engineering blog (most startups have one)
- [ ] Check Glassdoor/Blind for recent interview experiences
- [ ] For remote companies: read their handbook/values page (GitLab's is public)
- [ ] Understand the company's tech stack from job posting and blog posts
- [ ] Know the company's scale: users, revenue, funding round, team size

### 10.2 System Design Preparation (2–4 weeks)

- [ ] Master [[07_interview_framework/the_four_step_framework]]
- [ ] Practice 5 case studies from this vault:
  - [ ] [[05_case_studies/design_notification_system]]
  - [ ] [[05_case_studies/design_rate_limiter]]
  - [ ] [[05_case_studies/design_chat_system]]
  - [ ] [[05_case_studies/design_logging_system]]
  - [ ] [[05_case_studies/design_url_shortener]]
- [ ] Study [[02_building_blocks/caching]] and [[02_building_blocks/message_queues]]
- [ ] Know AWS/GCP pricing for common services (Section 3.4 above)
- [ ] Practice estimation using [[07_interview_framework/estimation_cheat_sheet]]
- [ ] Understand [[15_intermediate_topics/docker_and_kubernetes]]
- [ ] Review [[15_intermediate_topics/cloud_architecture_patterns]]
- [ ] Practice explaining MVP-first architecture with scaling roadmap

### 10.3 Take-Home Preparation

- [ ] Have a project template ready (Docker, CI, linting, testing configured)
- [ ] Practice writing clear READMEs
- [ ] Know your preferred stack deeply (don't learn something new for the assignment)
- [ ] Have examples of well-structured side projects on GitHub
- [ ] Practice time-boxing: 10 hours max for a 72-hour assignment

### 10.4 Remote Company Preparation

- [ ] Practice written communication — write clearly and concisely
- [ ] Prepare examples of async collaboration from past roles
- [ ] Have a home office setup that looks professional on video calls
- [ ] Be ready to discuss how you manage your time without supervision
- [ ] Read about the company's remote work philosophy

### 10.5 Company-Specific Preparation

**Indian Startups (Meesho, Zepto, Urban Company):**
- Expect 1–2 DSA rounds in addition to system design
- Know India-specific concerns: UPI payments, regional languages, Tier-2/3 city users
- Prepare for scale discussions specific to Indian internet users
- Understand logistics/delivery optimization if applying to commerce companies

**GitLab:**
- Read the GitLab Handbook (handbook.gitlab.com) — they will ask about it
- Understand merge request workflow deeply
- Prepare to discuss iteration and boring solutions
- Values interview is critical: CREDIT (Collaboration, Results, Efficiency, etc.)

**Automattic:**
- Prepare for the paid trial project (2–4 weeks)
- WordPress/PHP knowledge is a plus but not required
- Strong written communication is the most important signal
- They use P2 blogs for all internal communication

**Vercel/Supabase:**
- Open-source contributions are a major plus
- Understand edge computing and serverless deeply
- Know the product (Next.js / Supabase) and use it
- Developer experience mindset is critical

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│           STARTUP SYSTEM DESIGN INTERVIEW CHEAT SHEET       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ALWAYS start with current scale, not theoretical max    │
│  2. Monolith first, extract services when there's a reason  │
│  3. Managed services (RDS, ElastiCache) over self-hosted    │
│  4. Mention AWS costs for every infrastructure choice       │
│  5. MVP → iterate → scale (not: design for 1B users)        │
│  6. Monitoring + alerting from day 1 (Sentry, Datadog)      │
│  7. PostgreSQL is your default database until proven wrong   │
│  8. Redis (ElastiCache) for caching, sessions, rate limits  │
│  9. SQS for async jobs, Kafka only when you NEED streaming  │
│ 10. Show the migration path: "We'd upgrade to X when Y"     │
│                                                             │
│  KEY PHRASE: "At our current scale of X, I'd use [simple].  │
│  When we hit [trigger], we'd migrate to [complex]. The      │
│  migration path is [brief]."                                │
│                                                             │
│  COST AWARENESS: RDS ~$200/mo, Redis ~$150/mo, ALB ~$20/mo │
│  Lambda ~free at low scale, S3 ~$23/TB, SQS ~free          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

> **Next Steps:**
> - Review the [[07_interview_framework/the_four_step_framework]] for structured approach
> - Practice case studies linked in Section 4
> - Build a take-home template project and keep it ready
> - Return to [[17_company_interview_guide/index]] for other company guides
