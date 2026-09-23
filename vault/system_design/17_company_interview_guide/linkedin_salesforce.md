# LinkedIn & Salesforce System Design Interview Guide

> **Enterprise SaaS Giants** — Two companies that dominate their verticals
> (professional networking and CRM). Both value multi-tenancy, data isolation,
> and scalable platform thinking. This guide covers what to expect and how to
> prepare for system design rounds at each.

Back to [[17_company_interview_guide/index]]

---

## 1. Company Overview

### LinkedIn

| Attribute             | Details                                                        |
|-----------------------|----------------------------------------------------------------|
| **Parent Company**    | Microsoft (acquired 2016 for $26.2B)                           |
| **Headquarters**      | Sunnyvale, California                                          |
| **India Presence**    | Bangalore (largest engineering office outside US)               |
| **Scale**             | 1B+ members, 200+ countries, 61M+ companies listed             |
| **Core Products**     | Feed, Messaging, Jobs, Sales Navigator, LinkedIn Learning       |
| **Tech Stack**        | Java, Scala, Python, Kafka (invented here), Espresso, Voldemort |
| **Open Source**       | Kafka, Samza, Brooklin, Rest.li, Azkaban                       |
| **Engineering Blog**  | engineering.linkedin.com                                       |

**Key Technical Facts:**
- LinkedIn **invented Apache Kafka** — event streaming is in their DNA
- Social graph of 1B+ nodes with 100B+ edges
- Feed serves 100M+ daily active users
- Espresso is their custom NoSQL document store
- Rest.li is their internal REST framework (open-sourced)
- Heavily invested in AI/ML for feed ranking, people-you-may-know, job recommendations

### Salesforce

| Attribute             | Details                                                        |
|-----------------------|----------------------------------------------------------------|
| **Headquarters**      | San Francisco, California                                      |
| **India Presence**    | Hyderabad (major engineering hub), Bangalore, Mumbai            |
| **Scale**             | 150K+ customers, 4B+ transactions/day, multi-trillion records  |
| **Core Products**     | Sales Cloud, Service Cloud, Marketing Cloud, Platform, MuleSoft |
| **Tech Stack**        | Java, Apex (proprietary), Python, Oracle DB (core), PostgreSQL  |
| **Platform**          | Force.com / Lightning Platform — multi-tenant PaaS             |
| **Engineering Blog**  | engineering.salesforce.com                                      |

**Key Technical Facts:**
- Pioneer of **multi-tenant SaaS architecture** — one codebase, shared infra, 150K+ tenants
- Apex is their proprietary language (Java-like, runs on shared infrastructure)
- Governor limits enforce per-tenant resource isolation
- Metadata-driven architecture — schema is defined in metadata, not DDL
- Heroku (PaaS), MuleSoft (integration), Tableau (analytics) are subsidiaries
- Einstein AI layer across all products

### Pay Bands (2025-2026 Estimates)

#### LinkedIn (India — Bangalore)

| Level       | Title               | Base (INR/yr)   | Total Comp (INR/yr)  |
|-------------|---------------------|-----------------|----------------------|
| SDE-1       | Software Engineer    | 18-28L          | 25-40L               |
| SDE-2       | Sr. Software Eng.    | 30-45L          | 45-70L               |
| Staff       | Staff Engineer       | 50-70L          | 75-1.1Cr             |
| Sr. Staff   | Sr. Staff Engineer   | 70-90L          | 1.2-1.8Cr            |

#### LinkedIn (US)

| Level       | Title               | Base (USD/yr)   | Total Comp (USD/yr)  |
|-------------|---------------------|-----------------|----------------------|
| SDE-1       | Software Engineer    | $120-155K       | $170-230K            |
| SDE-2       | Sr. Software Eng.    | $155-195K       | $250-370K            |
| Staff       | Staff Engineer       | $195-240K       | $370-530K            |
| Sr. Staff   | Sr. Staff Engineer   | $230-280K       | $500-700K            |

#### Salesforce (India — Hyderabad)

| Level       | Title               | Base (INR/yr)   | Total Comp (INR/yr)  |
|-------------|---------------------|-----------------|----------------------|
| MTS         | Member of Tech Staff | 16-25L          | 22-35L               |
| SMTS        | Sr. MTS              | 28-42L          | 40-60L               |
| LMTS        | Lead MTS             | 42-60L          | 60-85L               |
| PMTS        | Principal MTS        | 55-80L          | 85-1.3Cr             |

#### Salesforce (US)

| Level       | Title               | Base (USD/yr)   | Total Comp (USD/yr)  |
|-------------|---------------------|-----------------|----------------------|
| MTS         | Member of Tech Staff | $115-145K       | $155-210K            |
| SMTS        | Sr. MTS              | $150-190K       | $230-340K            |
| LMTS        | Lead MTS             | $185-230K       | $320-460K            |
| PMTS        | Principal MTS        | $220-270K       | $430-600K            |

### Enterprise SaaS Culture

Both companies share enterprise SaaS DNA, but with distinct flavors:

- **LinkedIn** — Product-engineering culture blended with Microsoft's enterprise rigor.
  Strong data/ML orientation. "Members first" philosophy. Engineers own metrics.
- **Salesforce** — Platform-first culture. "Trust" is the #1 value (uptime, data isolation).
  Ohana culture (family). Engineers think in terms of multi-tenant resource fairness.
- **Common ground** — Both care deeply about backward compatibility, API contracts,
  SLA guarantees, and designing systems that serve thousands of enterprise customers
  without one bad tenant degrading others.

---

## 2. Interview Process

### LinkedIn Interview Pipeline

```
Application / Referral
        │
        ▼
Recruiter Screen (30 min)
   - Background, motivation, team fit
   - Leveling discussion
        │
        ▼
Phone Screen (60 min)
   - 1 coding round (LeetCode medium/hard)
   - Data structures & algorithms focus
   - Sometimes a system design phone screen for senior roles
        │
        ▼
Onsite / Virtual Onsite (4-5 rounds, ~5 hours)
   ├── Coding Round 1 (60 min) — DS/Algo, LeetCode style
   ├── Coding Round 2 (60 min) — DS/Algo or practical coding
   ├── System Design (60 min) — THE focus of this guide
   ├── Behavioral / Leadership (45-60 min) — "Tell me about a time..."
   └── [Senior+] Design Deep-dive or Architecture (60 min)
        │
        ▼
Hiring Committee Review
        │
        ▼
Offer (recruiter presents package)
```

**LinkedIn-Specific Notes:**
- Strongly influenced by Microsoft's interview culture post-acquisition
- System design round is mandatory for SDE-2 and above
- Behavioral round uses the "STAR" method and tests for LinkedIn values
- For Staff+, expect two design rounds (one broad, one deep-dive)
- LinkedIn interviewers tend to ask about graph problems, feed systems, and messaging

### Salesforce Interview Pipeline

```
Application / Referral
        │
        ▼
Recruiter Screen (30 min)
   - Role alignment, comp expectations
        │
        ▼
Phone / HackerRank Screen (60 min)
   - Coding assessment (sometimes async HackerRank first)
   - Medium-difficulty problems
        │
        ▼
Onsite / Virtual Onsite (4 rounds, ~4-5 hours)
   ├── Coding Round (60 min) — DS/Algo or practical coding
   ├── System Design (60 min) — Multi-tenant and CRM focus
   ├── Behavioral (45-60 min) — Salesforce values alignment
   └── Hiring Manager Round (45 min) — Team fit, technical depth
        │
        ▼
Debrief & Offer
```

**Salesforce-Specific Notes:**
- Less algorithm-heavy than LinkedIn; more emphasis on practical design
- System design questions often revolve around multi-tenancy and platform thinking
- Hiring manager round is a real evaluation, not a formality
- For LMTS+, expect deeper architectural discussions
- They value knowledge of SaaS patterns, API design, and data modeling
- Some teams use async HackerRank as a pre-screen before the phone round

### Side-by-Side Comparison

| Aspect                | LinkedIn                        | Salesforce                      |
|-----------------------|---------------------------------|---------------------------------|
| **Coding Difficulty** | Medium-Hard (LC style)          | Medium (more practical)         |
| **Design Focus**      | Feed, graph, messaging, search  | Multi-tenancy, CRM, workflows   |
| **Behavioral Style**  | STAR method, LinkedIn values    | Salesforce values (Trust, etc.) |
| **Rounds (Senior)**   | 4-5 rounds                      | 4 rounds                        |
| **Timeline**          | 2-4 weeks end-to-end            | 2-4 weeks end-to-end            |
| **Offer Negotiation** | Standard Microsoft band system  | Moderate flexibility             |

---

## 3. System Design Round Details

Use [[07_interview_framework/the_four_step_framework]] for structuring your answer.
Use [[07_interview_framework/estimation_cheat_sheet]] for back-of-envelope calculations.

### What LinkedIn Interviewers Look For

1. **Social Graph Thinking** — Can you reason about a graph with 1B+ nodes?
   Shortest paths, mutual connections, degrees of separation.
2. **Feed Ranking** — Not just fan-out; how do you rank content? ML models,
   engagement signals, relevance scoring.
3. **Event-Driven Architecture** — They invented Kafka. Show you understand
   event streaming, pub-sub, and async processing.
   See [[03_design_patterns/pub_sub]] and [[02_building_blocks/message_queues]].
4. **Scale & Latency** — Reference [[08_reference/latency_numbers]]. LinkedIn
   serves 100M+ DAU with sub-200ms feed loads.
5. **Data Modeling** — Entity relationships for professional profiles, companies,
   skills, endorsements, jobs.

### What Salesforce Interviewers Look For

1. **Multi-Tenancy** — This is THE differentiator. How do you serve 150K+
   customers on shared infrastructure without data leakage or noisy neighbors?
2. **Tenant Data Isolation** — Row-level security, org-based partitioning,
   encryption per tenant.
3. **Governor Limits / Rate Limiting** — Fair resource allocation. API limits,
   query limits, storage quotas. See [[05_case_studies/design_rate_limiter]].
4. **Metadata-Driven Design** — Salesforce does not run DDL per tenant. Schema
   is stored as metadata. Custom fields, objects, and workflows are all metadata.
5. **Platform Extensibility** — How do you build a platform that third-party
   developers can extend without breaking core functionality?

### Common Enterprise SaaS Themes (Both Companies)

- **API Design** — RESTful APIs with versioning, pagination, and rate limiting
- **CQRS** — Read-heavy workloads benefit from separating read/write paths.
  See [[03_design_patterns/cqrs]].
- **Caching** — Multi-layer caching for enterprise dashboards and feeds.
  See [[02_building_blocks/caching]] and [[05_case_studies/design_distributed_cache]].
- **Search** — Full-text search across millions of entities.
  See [[02_building_blocks/search_systems]].
- **Sharding** — Partitioning data by tenant, region, or entity ID.
  See [[03_design_patterns/sharding]].

---

## 4. Top 10 Most-Asked Questions

### LinkedIn Questions

#### Q1: Design LinkedIn Feed

> **Frequency:** Very High | **Level:** SDE-2+
> **Core reference:** [[05_case_studies/design_twitter]]

**Why it differs from Twitter:**
- Professional content (articles, job changes, endorsements) vs casual tweets
- Heavier ranking — not just chronological; relevance, network proximity, content type
- LinkedIn uses a two-pass ranking model (first-pass candidate generation, second-pass ML ranking)
- "Creator-side" features: who viewed your post, analytics for publishers

**Key components:**
- Social graph service (who follows whom, connection degrees)
- Content ingestion pipeline (Kafka-based)
- Feed ranking service (ML model serving)
- Feed storage (pre-computed feeds vs on-demand assembly)

**What to discuss:** Fan-out-on-write vs fan-out-on-read (hybrid approach), Kafka
for event streaming, caching hot feeds, ranking signals (engagement, recency,
network distance).

---

#### Q2: Design LinkedIn Search (People Search)

> **Frequency:** High | **Level:** SDE-2+
> **Core reference:** [[05_case_studies/design_search_autocomplete]]

**LinkedIn-specific angles:**
- Search across 1B+ member profiles
- Faceted search: filter by company, location, skills, industry, school
- Typeahead / autocomplete for names and titles
- Relevance ranking considers social graph proximity (your 1st connections rank higher)
- Galene is LinkedIn's custom search engine (built on Lucene)

**Key components:**
- Indexing pipeline (profile changes → Kafka → search index)
- Query parsing and intent detection
- Inverted index with graph-aware scoring
- Typeahead index (prefix tries or n-gram indexes)

---

#### Q3: Design LinkedIn Messaging

> **Frequency:** High | **Level:** SDE-2+
> **Core reference:** [[05_case_studies/design_chat_system]]

**LinkedIn-specific angles:**
- Professional messaging (not casual chat — no stories, no video calls originally)
- InMail system (messaging non-connections, paid feature)
- Read receipts and typing indicators
- Group messaging for recruiters
- Integration with LinkedIn notifications

**Key components:**
- WebSocket gateway for real-time delivery
- Message storage (partitioned by conversation ID)
- Presence service
- Push notification integration → [[05_case_studies/design_notification_system]]

---

#### Q4: Design Connection Recommendation Engine

> **Frequency:** High | **Level:** Staff+
> **No direct case study — graph + ML problem**

**"People You May Know" (PYMK):**
- The most important growth feature at LinkedIn
- Mutual connections (triangle closing in graph theory)
- Shared attributes: same company, school, location, industry
- Graph traversal: 2nd and 3rd degree connections
- ML model combining graph features + profile features + behavioral signals

**Key components:**
- Graph database / service (1B+ nodes, 100B+ edges)
- Candidate generation (graph traversal for 2nd-degree connections)
- Feature extraction (mutual connections count, shared employers, etc.)
- ML ranking model (gradient-boosted trees or neural network)
- Batch pre-computation (nightly job) + real-time adjustments

**Architecture sketch:**
```
Member Activity → Kafka → Feature Store
                              │
Graph Service ───► Candidate ──► ML Ranking ──► Top-K
                  Generator       Service      Recommendations
                              │
Profile Service ──────────────┘
```

---

#### Q5: Design LinkedIn Notifications

> **Frequency:** Medium-High | **Level:** SDE-2+
> **Core reference:** [[05_case_studies/design_notification_system]]

**LinkedIn-specific angles:**
- Multi-channel: push, email, in-app, SMS
- Smart batching (daily digest vs immediate for high-priority)
- Notification preferences per user (granular controls)
- "Someone viewed your profile" — aggregated notifications
- Job alerts, endorsement notifications, post engagement notifications

**Key focus:** Aggregation logic, user preference management, delivery optimization
(don't spam users), Kafka as the event bus.

---

### Salesforce Questions

#### Q6: Design Multi-Tenant CRM

> **Frequency:** Very High | **Level:** SMTS+
> **No direct case study — this IS the Salesforce problem**

**The Core Challenge:**
150K+ organizations share the same database cluster, application servers, and
codebase. One tenant must never see another's data. One tenant must never
degrade another's performance.

**Multi-Tenancy Approaches:**

| Approach               | Description                  | Salesforce Uses |
|------------------------|------------------------------|-----------------|
| **Shared Everything**  | Same DB, same schema, org_id | Yes (core)      |
| **Shared DB, Separate Schema** | Same DB, per-tenant schema | No        |
| **Dedicated DB**       | Per-tenant database          | Only for largest |

**Salesforce's Actual Architecture:**
- Shared Oracle DB with `org_id` column on every table
- Metadata tables define per-org custom objects and fields
- "Big Table" pattern: custom fields stored in generic columns (Value0..Value500)
- Query rewriter injects `WHERE org_id = ?` on every query automatically
- Tenant-aware connection pooling

**Key components to discuss:**
- Data isolation layer (row-level filtering by org_id)
- Metadata-driven schema (no DDL per tenant)
- Governor limits (CPU time, SOQL queries, DML operations per transaction)
- Query optimizer that respects tenant boundaries
- Encryption at rest per tenant (Salesforce Shield)

---

#### Q7: Design Workflow Automation Engine

> **Frequency:** High | **Level:** SMTS+
> **Think: Salesforce Flow / Process Builder / Apex Triggers**

**The Problem:**
Tenants define custom business logic: "When a deal closes, send an email to the
account manager, update the forecast, and create a task for onboarding."

**Key Design Decisions:**
- DSL vs code execution (Salesforce supports both: Flow is visual, Apex is code)
- Execution engine: interpret workflow definitions at runtime
- Sandboxing: tenant code must not crash the platform or access other tenants' data
- Governor limits: max 150 DML statements, 100 SOQL queries per transaction
- Async execution for long-running workflows (Queueable, Batch, Scheduled)

**Architecture:**
```
Trigger Event (record save, time-based, platform event)
        │
        ▼
Workflow Engine
   ├── Evaluate conditions (per tenant's workflow definition)
   ├── Execute actions (field updates, emails, callouts)
   ├── Enforce governor limits at each step
   └── Log execution for debugging
        │
        ▼
Async Queue (for deferred / batch operations)
```

---

#### Q8: Design Real-Time Dashboard

> **Frequency:** Medium-High | **Level:** SMTS+
> **References:** [[03_design_patterns/cqrs]], [[02_building_blocks/caching]]

**The Problem:**
Sales managers want a real-time view of pipeline, deals closed today, and
team performance. Data changes frequently (deal stages, amounts).

**Key challenges:**
- Pre-aggregation vs on-demand computation
- CQRS: write path (CRM transactions) vs read path (dashboard queries)
- Per-tenant materialized views
- WebSocket or SSE for real-time updates
- Caching strategy: tenant-aware cache with invalidation on data changes

**Architecture:**
```
CRM Write Path                    Dashboard Read Path
     │                                  │
     ▼                                  ▼
Transaction DB ──► Change Events ──► Aggregation
                   (Kafka/CDC)        Service
                                        │
                                        ▼
                                   Materialized
                                   Views (per tenant)
                                        │
                                        ▼
                                   Dashboard API
                                   (cached, tenant-scoped)
```

---

#### Q9: Design Rate Limiter for API

> **Frequency:** Medium-High | **Level:** SDE-2+ / SMTS+
> **Core reference:** [[05_case_studies/design_rate_limiter]]

**Enterprise SaaS angle:**
- Per-tenant rate limits (not just per-IP)
- Different tiers: free tier gets 1K API calls/day, enterprise gets 1M
- Per-endpoint limits (search is more expensive than record reads)
- Burst allowance with token bucket algorithm
- 429 responses with Retry-After header
- Real-time dashboard for API usage per tenant

**Salesforce-specific:** Governor limits are essentially rate limiters embedded
in the runtime — CPU time, heap size, SOQL queries, all bounded per transaction.

**LinkedIn-specific:** API rate limiting for partners, Sales Navigator API,
recruiter tools. Per-app and per-user limits.

---

#### Q10: Design Data Pipeline / ETL System

> **Frequency:** Medium | **Level:** Staff+ / LMTS+
> **References:** [[05_case_studies/design_logging_system]], [[02_building_blocks/message_queues]]

**The Problem:**
Enterprise customers need to move data into and out of the platform.
Salesforce has Data Loader, MuleSoft, and Change Data Capture.
LinkedIn has data pipelines feeding ML models, analytics, and search indexes.

**Key components:**
- Ingestion layer (batch upload, streaming APIs, CDC)
- Transformation engine (schema mapping, data cleansing, deduplication)
- Orchestration (DAG-based scheduling — think Airflow / Azkaban)
- Error handling and retry logic
- Monitoring and data quality checks

**Enterprise twist:** Multi-tenant data pipeline where one tenant's ETL job
must not consume all cluster resources. Priority queues and resource quotas.

---

## 5. Enterprise SaaS Patterns

### Multi-Tenancy Deep Dive

Multi-tenancy is the single most important pattern for both companies.

**Shared-Everything Model (Salesforce Core):**
```
┌──────────────────────────────────────────────┐
│                 Application Tier              │
│   (Shared code, tenant context from session)  │
├──────────────────────────────────────────────┤
│                 Database Tier                 │
│                                              │
│  ┌─────────┬─────────┬─────────┬──────────┐  │
│  │ org_001 │ org_002 │ org_003 │ org_N    │  │
│  │ rows    │ rows    │ rows    │ rows     │  │
│  └─────────┴─────────┴─────────┴──────────┘  │
│         Same tables, filtered by org_id       │
└──────────────────────────────────────────────┘
```

**Tenant Data Isolation Strategies:**
1. **Row-Level Security** — Every query includes `WHERE org_id = ?`
2. **Column-Level Encryption** — Per-tenant encryption keys (Salesforce Shield)
3. **Network Isolation** — VPC peering for dedicated tenants
4. **Audit Logging** — Track all cross-tenant access attempts

### API Rate Limiting Per Tenant

See [[05_case_studies/design_rate_limiter]] for the core pattern.

```
Client Request
     │
     ▼
API Gateway
     │
     ├── Extract tenant ID from auth token
     ├── Look up tenant's rate limit tier
     ├── Check token bucket (Redis-backed)
     │      │
     │      ├── Tokens available → Forward request
     │      └── Bucket empty → Return 429
     │
     ▼
Backend Service
```

**Tier-based limits example:**
| Tier       | API Calls/Day | Concurrent Requests | Burst Rate    |
|------------|---------------|---------------------|---------------|
| Free       | 1,000         | 5                   | 10/sec        |
| Pro        | 50,000        | 25                  | 50/sec        |
| Enterprise | 1,000,000     | 100                 | 500/sec       |
| Unlimited  | Custom SLA    | Custom              | Custom        |

### Social Graph (LinkedIn)

LinkedIn's social graph is one of the largest in the world:
- **1B+ nodes** (members, companies, schools, skills, jobs)
- **100B+ edges** (connections, follows, endorsements, employment)
- **Average degree:** ~500 connections per active member

**Graph Operations & Complexity:**
| Operation                    | Approach                            | Latency Target |
|------------------------------|-------------------------------------|----------------|
| Mutual connections           | Set intersection on adjacency lists | < 50ms         |
| 2nd-degree connections       | BFS depth=2 with pruning            | < 200ms        |
| Shortest path (A to B)       | Bidirectional BFS                  | < 500ms        |
| People You May Know          | Pre-computed + real-time blend      | < 100ms        |
| Connection degree (1st/2nd/3rd) | Indexed graph lookup             | < 10ms         |

**Graph Storage:**
- LinkedIn uses a custom graph database (not Neo4j at their scale)
- Adjacency lists stored in memory-mapped files
- Partitioned by member ID (consistent hashing)
- Replicated across data centers for read availability

### Feed Ranking Algorithms (LinkedIn)

LinkedIn's feed is NOT chronological — it is heavily ranked.

**Two-Pass Ranking Architecture:**
```
Pass 1: Candidate Generation (1000s of candidates)
   - Recent posts from 1st-degree connections
   - Popular posts from 2nd-degree network
   - Sponsored content
   - Editorial / trending content
            │
            ▼
Pass 2: ML Ranking (select top 50-100)
   - Engagement prediction (P(like), P(comment), P(share))
   - Relevance score (topic match with user interests)
   - Network proximity (closer connections ranked higher)
   - Content quality score (spam detection, clickbait filtering)
   - Diversity injection (avoid showing only one content type)
            │
            ▼
Final Feed (paginated, 10-20 items per page)
```

**Ranking Signals:**
- **User features:** Industry, seniority, interests, past engagement patterns
- **Content features:** Author credibility, content type, media presence, freshness
- **Interaction features:** Mutual connections with author, past interactions
- **Context features:** Time of day, device, session depth

### CQRS for Read-Heavy Workloads

See [[03_design_patterns/cqrs]] for the full pattern.

Both LinkedIn (feed reads >> writes) and Salesforce (dashboard reads >> CRM writes)
benefit from CQRS:

```
Write Model                          Read Model
(normalized,                         (denormalized,
 transactional)                       optimized for queries)
     │                                      ▲
     │         ┌──────────────┐             │
     └────────►│  Event Bus   │─────────────┘
               │  (Kafka)     │
               └──────────────┘
```

### Kafka for Event Streaming (LinkedIn Heritage)

LinkedIn invented Kafka, and it remains central to their architecture:

**Use cases at LinkedIn:**
- Feed updates (new post → fan-out to followers)
- Profile change propagation (update search index, recommendations)
- Activity tracking (page views, clicks, impressions)
- Metrics pipeline (monitoring, alerting)
- Change data capture (DB changes → downstream consumers)

**Why Kafka matters in interviews:**
- Show you understand publish-subscribe at scale → [[03_design_patterns/pub_sub]]
- Topic partitioning for parallelism
- Consumer groups for load balancing
- Exactly-once semantics for financial data
- Retention policies for replay capability

### Apex Runtime & Governor Limits (Salesforce)

Salesforce runs tenant code (Apex) on shared infrastructure. The Apex runtime
enforces strict resource limits:

**Governor Limits (per transaction):**
| Resource                        | Synchronous Limit | Async Limit  |
|---------------------------------|--------------------|--------------|
| SOQL Queries                    | 100                | 200          |
| DML Statements                  | 150                | 150          |
| CPU Time                        | 10,000 ms          | 60,000 ms    |
| Heap Size                       | 6 MB               | 12 MB        |
| Callouts (HTTP)                 | 100                | 100          |
| Total records retrieved (SOQL)  | 50,000             | 50,000       |

**Design implications:**
- Bulkification: process records in batches, not one-by-one
- Lazy loading: don't query data you don't need
- Async processing: offload heavy work to Queueable / Batch classes
- These governor limits ARE a system design concept — they are a form of
  tenant-level resource isolation in a shared-compute environment

---

## 6. Sample Walkthrough: Design LinkedIn Feed

Using [[07_interview_framework/the_four_step_framework]]:

### Step 1: Requirements & Scope (5 minutes)

**Functional:**
- Users see a personalized feed of posts from their network
- Posts can contain text, images, videos, articles, and job change updates
- Users can like, comment, share, and save posts
- Feed supports pagination (infinite scroll)

**Non-Functional:**
- 100M+ daily active users
- Feed load latency < 200ms (p99)
- Posts should appear in followers' feeds within 30 seconds
- High availability (99.99% uptime)
- Feed is read-heavy: 100:1 read-to-write ratio

**Back-of-envelope (use [[07_interview_framework/estimation_cheat_sheet]]):**
- 100M DAU, each loads feed ~10 times/day = 1B feed requests/day
- 1B / 86400 = ~12K feed requests/sec (peak: ~36K/sec)
- 2M new posts/day = ~23 posts/sec
- Average user has 500 connections → fan-out of 500 per post
- 2M posts x 500 avg connections = 1B feed entries/day to distribute

### Step 2: High-Level Design (10 minutes)

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client   │────►│  API Gateway  │────►│  Feed Service │
│  (App)    │◄────│  + CDN        │◄────│              │
└──────────┘     └──────────────┘     └──────┬───────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                    ┌────▼─────┐    ┌───────▼──────┐   ┌───────▼──────┐
                    │  Feed    │    │   Ranking    │   │   Social     │
                    │  Cache   │    │   Service    │   │   Graph      │
                    │ (Redis)  │    │   (ML)       │   │   Service    │
                    └──────────┘    └──────────────┘   └──────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │  Feature    │
                                    │  Store      │
                                    └─────────────┘

Write Path:
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  Author   │────►│  Post Service │────►│    Kafka      │────►│ Fan-out  │
│           │     │              │     │              │     │ Service  │
└──────────┘     └──────────────┘     └──────────────┘     └────┬─────┘
                                                                │
                                                    ┌───────────┼──────────┐
                                                    │           │          │
                                               ┌────▼──┐  ┌────▼──┐ ┌────▼──┐
                                               │Feed   │  │Feed   │ │Feed   │
                                               │Cache  │  │Cache  │ │Cache  │
                                               │User A │  │User B │ │User C │
                                               └───────┘  └───────┘ └───────┘
```

### Step 3: Deep Dive (20 minutes)

**Fan-Out Strategy (Hybrid Approach):**

| User Type          | Strategy           | Reason                              |
|--------------------|--------------------|-------------------------------------|
| Regular user       | Fan-out-on-write   | Pre-compute feed for fast reads     |
| Celebrity (10K+)   | Fan-out-on-read    | Too expensive to write to all feeds |

- When a regular user posts → Fan-out Service pushes post ID to all
  followers' feed caches (via Kafka consumers)
- When a celebrity posts → Store in celebrity posts table; merge at
  read time when follower loads their feed

**Feed Storage:**
```
Feed Cache (Redis Sorted Set per user):
   Key: feed:{user_id}
   Members: post_id
   Score: ranking_score (not just timestamp)

   ZREVRANGE feed:12345 0 19  → top 20 posts for user 12345
```

**Ranking Pipeline (detailed):**
```
Feed Request
     │
     ▼
Candidate Pool (from cache + celebrity posts)
     │ ~1000 candidates
     ▼
Light Ranker (fast model — logistic regression)
     │ ~200 candidates
     ▼
Heavy Ranker (deep model — neural network)
     │ ~50 candidates
     ▼
Business Rules (diversity, de-duplication, ad insertion)
     │ ~20 items
     ▼
Response to Client
```

**Social Graph Integration:**
- Graph service provides connection degree (1st, 2nd, 3rd)
- Mutual connections count (used as ranking feature)
- Industry and company overlap signals
- The graph is partitioned by member_id using consistent hashing
  → see [[03_design_patterns/sharding]]

**Kafka Pipeline (post ingestion):**
```
New Post → Post Service → Kafka Topic: "posts.created"
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         Fan-out         Search Index     Notification
         Consumer        Consumer         Consumer
              │               │               │
         Write to        Update Galene    Trigger push
         feed caches     search index     notifications
```

**Caching Strategy (see [[02_building_blocks/caching]]):**
- L1 Cache: Application-level (feed service in-memory, hot users)
- L2 Cache: Redis cluster (feed sorted sets, 7-day TTL)
- L3 Cache: Feed DB (for cold users, reconstruct from posts table)
- Cache invalidation: On new post fan-out, ZADD to sorted set
- Cache warming: Pre-compute feeds for users likely to log in (ML-predicted)

### Step 4: Wrap-Up (5 minutes)

**Bottlenecks & Mitigations:**
- Hot partitions (celebrity fan-out) → Hybrid fan-out strategy
- Feed cache memory → LRU eviction, compress old entries, only cache active users
- Ranking latency → Two-pass ranking, pre-computed features, model distillation
- Kafka lag → Scale consumer groups, partition by geographic region

**Extensions to mention:**
- A/B testing framework for ranking models
- Content moderation pipeline (spam, misinformation)
- Internationalization (ranking by language preference)
- Offline feed pre-computation for users who open the app at predictable times

---

## 7. Red Flags & Green Flags

### Red Flags (Things That Hurt You)

| Red Flag                                           | Why It Hurts                                    |
|----------------------------------------------------|-------------------------------------------------|
| Ignoring multi-tenancy in Salesforce questions      | It is their core architecture                   |
| Designing feed as purely chronological              | LinkedIn feed is ML-ranked                      |
| Not considering the social graph in LinkedIn designs| Graph is central to every LinkedIn product       |
| Single database with no sharding for 1B users       | Shows lack of scale awareness                   |
| No mention of Kafka or event streaming at LinkedIn  | They invented it; it is everywhere               |
| Ignoring data isolation / security                  | Enterprise customers demand it                   |
| Over-engineering without justification              | "Use blockchain for..." → immediate red flag     |
| Not asking clarifying questions                     | Jumping to solutions is universally bad           |
| Forgetting rate limiting in API design              | Enterprise SaaS without rate limiting is broken  |
| Monolith with no clear service boundaries           | Both companies operate microservices at scale     |

### Green Flags (Things That Help You)

| Green Flag                                          | Why It Helps                                    |
|-----------------------------------------------------|-------------------------------------------------|
| Discussing tenant isolation strategies unprompted    | Shows enterprise SaaS maturity                  |
| Mentioning Kafka for async processing at LinkedIn   | Cultural fit with their tech stack               |
| Hybrid fan-out (write + read) for feed              | Shows nuanced understanding of trade-offs        |
| Bringing up governor limits / resource quotas        | Shows Salesforce platform awareness              |
| Quantifying with numbers (QPS, storage, latency)    | Shows engineering rigor                          |
| Discussing ranking vs just retrieval for feed        | Shows ML-awareness for LinkedIn                  |
| Mentioning CQRS for read-heavy dashboards           | Enterprise SaaS best practice                   |
| Proactively addressing failure modes                | Both companies run mission-critical systems      |
| Referencing real tech (Espresso, Galene, Force.com)  | Shows you researched the company                |
| Drawing clear diagrams with labeled components       | Communication matters in both cultures           |

---

## 8. Preparation Checklist

### Two Weeks Before

- [ ] Review [[07_interview_framework/the_four_step_framework]] and practice it until automatic
- [ ] Study [[05_case_studies/design_twitter]] thoroughly (LinkedIn feed foundation)
- [ ] Read 5-10 LinkedIn Engineering blog posts (engineering.linkedin.com)
- [ ] Read Salesforce architecture white papers (trust.salesforce.com for scale numbers)
- [ ] Understand multi-tenancy patterns (shared-everything vs shared-nothing)
- [ ] Memorize [[08_reference/latency_numbers]] for back-of-envelope math
- [ ] Study [[05_case_studies/design_chat_system]] for LinkedIn Messaging variant
- [ ] Study [[05_case_studies/design_search_autocomplete]] for LinkedIn Search variant

### One Week Before

- [ ] Do two full mock interviews (45-60 min each) with a peer
- [ ] Practice "Design LinkedIn Feed" end-to-end in 35 minutes
- [ ] Practice "Design Multi-Tenant CRM" end-to-end in 35 minutes
- [ ] Review [[05_case_studies/design_rate_limiter]] (critical for Salesforce)
- [ ] Review [[05_case_studies/design_notification_system]] (critical for LinkedIn)
- [ ] Study Kafka basics: topics, partitions, consumer groups, exactly-once
- [ ] Understand graph algorithms: BFS, shortest path, triangle closing
- [ ] Review [[05_case_studies/design_distributed_cache]] for caching patterns
- [ ] Practice [[07_interview_framework/estimation_cheat_sheet]] with 3-4 problems

### Day Before

- [ ] Review this guide once more
- [ ] Prepare 3-4 behavioral stories (STAR format) aligned with company values
- [ ] LinkedIn values: Members First, Relationships Matter, Be Open/Honest/Constructive
- [ ] Salesforce values: Trust, Customer Success, Innovation, Equality, Sustainability
- [ ] Get whiteboard / drawing tool ready (Excalidraw, pen+paper)
- [ ] Sleep well — a rested mind draws better system diagrams

### LinkedIn-Specific Prep

- [ ] Understand Rest.li (their REST framework)
- [ ] Know Espresso (their document store) at a high level
- [ ] Know Kafka deeply — not just "we use Kafka" but partitioning, consumer groups
- [ ] Understand how social graphs are stored and queried at scale
- [ ] Read about Galene (their search engine built on Lucene)
- [ ] Study feed ranking signals and two-pass ranking architecture
- [ ] Know the difference between connection graph and follow graph

### Salesforce-Specific Prep

- [ ] Understand Apex and governor limits conceptually
- [ ] Know the metadata-driven architecture (no DDL per tenant)
- [ ] Understand multi-tenant query optimization (org_id indexing)
- [ ] Study the Salesforce Platform Event model (pub-sub for tenants)
- [ ] Know MuleSoft at a high level (API integration platform)
- [ ] Understand Salesforce's trust architecture (encryption, audit, compliance)
- [ ] Be familiar with SOQL (Salesforce Object Query Language) constraints

---

## Quick Reference: Key Numbers

| Metric                          | LinkedIn          | Salesforce         |
|---------------------------------|-------------------|--------------------|
| **Users / Tenants**             | 1B+ members       | 150K+ orgs         |
| **DAU / Daily Transactions**    | 100M+ DAU         | 4B+ txns/day       |
| **Data Scale**                  | 100B+ graph edges  | Multi-trillion rows|
| **Feed / Dashboard Latency**   | < 200ms (p99)     | < 1s (dashboards)  |
| **Availability Target**        | 99.99%            | 99.99%             |
| **Primary Data Store**         | Espresso, Voldemort| Oracle, PostgreSQL |
| **Event Streaming**            | Kafka (internal)  | Platform Events    |
| **Search Engine**              | Galene (Lucene)   | SOSL / custom      |

---

## Related Resources

- [[05_case_studies/design_twitter]] — Feed system foundations
- [[05_case_studies/design_search_autocomplete]] — Search and typeahead patterns
- [[05_case_studies/design_chat_system]] — Messaging architecture
- [[05_case_studies/design_notification_system]] — Notification delivery
- [[05_case_studies/design_rate_limiter]] — Rate limiting (critical for SaaS APIs)
- [[05_case_studies/design_distributed_cache]] — Caching for feeds and dashboards
- [[05_case_studies/design_key_value_store]] — Storage layer patterns
- [[05_case_studies/design_url_shortener]] — URL shortening (good warm-up problem)
- [[05_case_studies/design_logging_system]] — Logging and data pipelines
- [[03_design_patterns/pub_sub]] — Pub-sub patterns (Kafka-centric)
- [[03_design_patterns/cqrs]] — CQRS for read-heavy systems
- [[03_design_patterns/sharding]] — Data partitioning strategies
- [[02_building_blocks/caching]] — Multi-layer caching
- [[02_building_blocks/message_queues]] — Message queue fundamentals
- [[02_building_blocks/search_systems]] — Search infrastructure
- [[07_interview_framework/the_four_step_framework]] — How to structure every answer
- [[07_interview_framework/estimation_cheat_sheet]] — Back-of-envelope math
- [[08_reference/latency_numbers]] — Latency reference card

---

*Last updated: 2026-02-23*
