# Atlassian System Design Interview Guide

> **Navigation:** [[17_company_interview_guide/index]] | [[07_interview_framework/the_four_step_framework]]
> **Last Updated:** 2026-02-23

---

## Table of Contents

1. [Company Overview](#company-overview)
2. [Interview Process](#interview-process)
3. [System Design Round Details](#system-design-round-details)
4. [The Values Interview — Atlassian's Secret Weapon](#the-values-interview)
5. [Top 10 Most-Asked System Design Questions](#top-10-most-asked-system-design-questions)
6. [Atlassian-Specific Patterns](#atlassian-specific-patterns)
7. [Sample Walkthrough — Design Jira](#sample-walkthrough--design-jira)
8. [Red Flags and Green Flags](#red-flags-and-green-flags)
9. [Preparation Checklist](#preparation-checklist)

---

## Company Overview

### What Atlassian Builds

Atlassian is an Australian-founded enterprise software company best known for:

- **Jira** — Issue tracking and project management (the product they ask about most)
- **Confluence** — Collaborative wiki and knowledge management
- **Bitbucket** — Git-based source code hosting and CI/CD
- **Trello** — Kanban-style project boards
- **Opsgenie** — Incident management and alerting
- **Statuspage** — Public and internal status communication
- **Jira Service Management** — ITSM platform
- **Loom** — Async video messaging (acquired 2023)
- **Rovo** — AI-powered enterprise search and agents

Their massive cloud migration (Server to Cloud) is a defining engineering challenge
and shows up frequently in system design interviews.

### Engineering Levels

| Level | Title                    | Scope                                    |
|-------|--------------------------|------------------------------------------|
| P1    | Associate Engineer       | Task-level execution with guidance        |
| P2    | Engineer                 | Independent feature delivery              |
| P3    | Senior Engineer          | Cross-team technical leadership           |
| P4    | Principal Engineer       | Org-wide architecture and strategy        |
| P5    | Distinguished Engineer   | Company-wide technical direction          |
| P6    | Fellow                   | Industry-level impact (extremely rare)    |

System design interviews are standard for P3+ and increasingly common for P2.

### Compensation Bands (2025-2026 Estimates)

**India — Bangalore**

| Level | Base (INR/yr)       | RSU (INR/yr vesting) | Total Comp (INR/yr)  |
|-------|---------------------|----------------------|----------------------|
| P2    | 28L - 42L           | 8L - 18L             | 36L - 60L            |
| P3    | 42L - 62L           | 18L - 35L            | 60L - 97L            |
| P4    | 62L - 85L           | 35L - 60L            | 97L - 1.45Cr         |

**Sydney, Australia (HQ)**

| Level | Base (AUD/yr)       | RSU (AUD/yr vesting) | Total Comp (AUD/yr)  |
|-------|---------------------|----------------------|----------------------|
| P2    | 130K - 165K         | 30K - 60K            | 160K - 225K          |
| P3    | 165K - 210K         | 60K - 110K           | 225K - 320K          |
| P4    | 210K - 270K         | 110K - 180K          | 320K - 450K          |

**United States — San Francisco / Austin / New York (Remote-First)**

| Level | Base (USD/yr)       | RSU (USD/yr vesting) | Total Comp (USD/yr)  |
|-------|---------------------|----------------------|----------------------|
| P2    | 140K - 180K         | 40K - 80K            | 180K - 260K          |
| P3    | 180K - 230K         | 80K - 150K           | 260K - 380K          |
| P4    | 230K - 290K         | 150K - 250K          | 380K - 540K          |
| P5    | 290K - 360K         | 250K - 400K          | 540K - 760K          |

Notes:
- Atlassian went **fully distributed** (no offices required) in 2022 under their
  "Team Anywhere" policy. US salaries are generally location-agnostic.
- RSUs vest over 4 years with a 1-year cliff, quarterly thereafter.
- Annual refreshers are common at P3+ and can significantly increase total comp.
- Atlassian does NOT do signing bonuses as aggressively as FAANG.

### Team Structure

- Teams are organized around **products** (Jira, Confluence, Platform, etc.)
- Each product has multiple **squads** of 5-8 engineers
- Squads follow a **"run what you build"** philosophy (you own deployment + on-call)
- Strong emphasis on **autonomous teams** — less top-down direction than most companies
- Platform teams build shared infrastructure (identity, permissions, data pipeline, etc.)

### Remote-Friendly Culture

- "Team Anywhere" policy: work from any location where Atlassian has a legal entity
- Offices exist as collaboration hubs, not mandatory workplaces
- Teams gather in-person roughly once per quarter for "intentional togetherness"
- Heavy use of their own products for async collaboration (Confluence, Loom, Jira)
- This culture directly influences interviews — they value async communication skills

---

## Interview Process

### The Pipeline

```
Application / Referral
        |
        v
  Recruiter Screen (30 min)
        |
        v
  Phone Technical Screen (60 min)
  - Coding + basic design discussion
        |
        v
  ┌─────────────────────────────────────────────┐
  │          On-site / Virtual Loop              │
  │                                              │
  │  1. Values Interview (60 min) *** CRITICAL   │
  │  2. System Design (60 min)                   │
  │  3. Technical Deep Dive (60 min)             │
  │  4. Manager / Team Fit (45-60 min)           │
  │                                              │
  └─────────────────────────────────────────────┘
        |
        v
  Hiring Committee Review
        |
        v
  Offer (1-2 weeks post-loop)
```

### Timeline

| Stage                     | Typical Duration         |
|---------------------------|--------------------------|
| Application to Recruiter  | 1-3 weeks                |
| Recruiter to Phone Screen | 1 week                   |
| Phone Screen to Loop      | 1-2 weeks                |
| Loop to Decision          | 1-2 weeks                |
| Decision to Offer         | 3-5 business days        |
| **Total end-to-end**      | **4-8 weeks**            |

### The Critical Difference: Values Interview Has Veto Power

This is the single most important thing to understand about Atlassian interviews:

> **The Values Interview is a MANDATORY PASS. A "no" on values is an automatic
> rejection regardless of how well you perform on technical rounds.**

This is not lip service. Atlassian genuinely rejects strong technical candidates
who fail the values round. The values interview is typically conducted by someone
outside your prospective team, specifically trained to evaluate cultural alignment.

Even in the system design round, interviewers are evaluating how you collaborate.
The two rounds reinforce each other.

---

## System Design Round Details

### Format

| Aspect          | Details                                              |
|-----------------|------------------------------------------------------|
| Duration        | 60 minutes                                           |
| Style           | Collaborative — treat the interviewer as a teammate   |
| Tools           | Whiteboard (on-site) or virtual whiteboard (remote)   |
| Seniority Focus | P2: basic design; P3: full system; P4+: deep trade-offs |
| Interviewer     | Typically a senior or principal engineer from the team |

### What They Evaluate

Atlassian's system design rubric emphasizes four pillars:

**1. Collaboration and Communication (Highest Weight)**
- Do you ask clarifying questions or just start monologuing?
- Do you incorporate the interviewer's suggestions and feedback?
- Do you explain your reasoning clearly, not just your conclusion?
- Do you explicitly call out trade-offs and invite discussion?

**2. Problem Structuring**
- Can you break an ambiguous problem into clear components?
- Do you define scope and constraints before diving into solutions?
- See [[07_interview_framework/the_four_step_framework]]

**3. Technical Breadth**
- Can you reason about databases, caches, queues, search, and networking?
- Do you know when to use what? See [[02_building_blocks/caching]],
  [[02_building_blocks/message_queues]], [[02_building_blocks/search_systems]]

**4. Technical Depth (P3+ expectation)**
- Can you go deep on at least one area (data modeling, consistency, scaling)?
- Do you understand the real-world implications of your choices?

### How the 60 Minutes Break Down

```
 0:00 - 0:08  Problem statement + clarifying questions
 0:08 - 0:15  High-level design + API sketch
 0:15 - 0:35  Detailed component design + data model
 0:35 - 0:50  Deep dive into 1-2 critical areas
 0:50 - 0:58  Scaling, trade-offs, and future considerations
 0:58 - 1:00  Questions for the interviewer
```

### The Collaboration Difference

At most companies, you present your design. At Atlassian, you **build it together**.

Do this:
- "What do you think about using event sourcing here? I see pros and cons..."
- "I am leaning toward Kafka for this queue — does that match what you have seen?"
- "I want to make sure I am not missing anything — should we discuss X?"

Do NOT do this:
- Monologue for 10 minutes without checking in
- Dismiss the interviewer's suggestions
- Refuse to change direction when given a hint

This maps directly to their value: **"Play, as a team."**

---

## The Values Interview

### Atlassian's 5 Core Values

These are not slogans. They are evaluated in a dedicated 60-minute interview
and bleed into every other round.

#### 1. Open Company, No Bullshit

**What it means:**
- Radical transparency in decision-making
- Share information by default, restrict by exception
- Give and receive direct feedback without ego

**How it shows up in system design:**
- Be honest about what you do not know: "I have not worked with CRDTs directly,
  but here is my understanding..."
- Clearly state trade-offs rather than pretending your design is perfect
- If you realize a mistake mid-design, call it out and correct course

**Interview question examples:**
- "Tell me about a time you gave difficult feedback to a teammate."
- "Describe a situation where you disagreed with a technical decision. What did you do?"

#### 2. Build with Heart and Balance

**What it means:**
- Care deeply about craftsmanship, but also about sustainability
- Avoid burnout culture; long-term thinking over heroics
- Empathy for users and teammates

**How it shows up in system design:**
- Consider operational burden: "This design is simpler to operate and debug"
- Think about developer experience: "Other teams will need to integrate with this"
- Balance ideal architecture with practical delivery timelines

**Interview question examples:**
- "How do you balance shipping quickly with building the right thing?"
- "Tell me about a time you had to make a pragmatic engineering compromise."

#### 3. Don't #@!% the Customer

**What it means:**
- Customer impact is the ultimate measure of success
- Reliability, performance, and usability are non-negotiable
- When in doubt, choose the option that is best for the customer

**How it shows up in system design:**
- Start with user needs, not technology choices
- Discuss SLAs, latency targets, and failure modes explicitly
- Reference [[08_reference/latency_numbers]] to show you think about user experience
- Consider multi-tenant isolation: one bad tenant should not degrade others

**Interview question examples:**
- "Tell me about a time a technical decision you made directly improved customer experience."
- "Describe a situation where you had to choose between technical elegance and customer value."

#### 4. Play, as a Team

**What it means:**
- Collaboration over individual heroism
- Help others succeed; celebrate team wins
- Build consensus through discussion, not authority

**How it shows up in system design:**
- The entire design round is structured as a collaboration exercise
- Actively ask for the interviewer's input
- Acknowledge good ideas from the interviewer: "That is a great point, let me
  incorporate that..."
- Think about how other teams will interact with your system

**Interview question examples:**
- "Tell me about a time you helped a struggling teammate."
- "Describe a cross-team collaboration that was challenging. How did you handle it?"

#### 5. Be the Change You Seek

**What it means:**
- Take initiative rather than waiting for permission
- Drive improvement proactively
- Own problems end-to-end

**How it shows up in system design:**
- Proactively identify potential problems in your design before being asked
- Suggest monitoring, alerting, and observability without being prompted
- Propose migration strategies and rollout plans
- "Here is how I would incrementally roll this out and measure success..."

**Interview question examples:**
- "Tell me about a time you identified a problem and drove the solution without being asked."
- "Describe a process or system you improved on your own initiative."

### STAR Format for Values

Prepare 8-10 stories that map to multiple values. Use STAR format:

```
Situation  → Set the context (1-2 sentences)
Task       → What was your responsibility?
Action     → What specifically did YOU do? (most of your answer)
Result     → What was the measurable outcome?
```

Each story should take 3-4 minutes to tell. Have follow-up details ready.

---

## Top 10 Most-Asked System Design Questions

### 1. Design Jira (Issue Tracking System)

**Frequency:** Very High — this is the #1 most-asked question at Atlassian.
**See:** [Full Walkthrough Below](#sample-walkthrough--design-jira)

Key areas: workflow engine, permission model, real-time board updates, search,
multi-tenancy, plugin extensibility.

### 2. Design Confluence (Collaborative Wiki)

**Frequency:** High
**Related:** [[05_case_studies/design_google_docs]]

Key areas:
- Real-time collaborative editing (OT or CRDTs)
- Page tree hierarchy and navigation
- Rich content storage (text, macros, embeds, attachments)
- Version history and diff
- Permission inheritance (space → page → child page)
- Search indexing of structured and unstructured content
- Macro/plugin rendering pipeline

The Google Docs case study covers collaborative editing fundamentals.
Confluence adds complexity with:
- Nested page hierarchies
- Macro system (dynamic content embedded in pages)
- Space-level permissions vs page-level restrictions
- Cross-product linking (Jira issues embedded in Confluence pages)

### 3. Design Bitbucket (Code Review System)

**Frequency:** High

Key areas:
- Git hosting and repository storage at scale
- Pull request workflow (create, review, approve, merge)
- Diff computation and rendering for large changesets
- Inline comments with threading
- CI/CD pipeline integration (Bitbucket Pipelines)
- Branch permissions and merge checks
- Code search across repositories

Data model considerations:
- Repository metadata vs git object storage (separate concerns)
- Pull request state machine (open → reviewing → approved → merged / declined)
- Comment anchoring to specific lines across rebases

### 4. Design Notification System

**Frequency:** High
**Related:** [[05_case_studies/design_notification_system]]

Atlassian twist: notifications span multiple products (Jira, Confluence, Bitbucket).

Key areas:
- Multi-channel delivery (in-app, email, push, Slack integration)
- User preference management (per-product, per-project granularity)
- Batching and digest (do not spam users with 50 emails per hour)
- Cross-product notification aggregation
- "Watch" and "mention" semantics
- Notification center with read/unread state

Use [[02_building_blocks/message_queues]] for the delivery pipeline.

### 5. Design Search for Jira

**Frequency:** Medium-High
**Related:** [[05_case_studies/design_search_autocomplete]]

Key areas:
- JQL (Jira Query Language) — a structured query language for issues
- Full-text search across issue titles, descriptions, comments
- Faceted search (by project, status, assignee, label, sprint)
- Real-time index updates when issues change
- Multi-tenant index isolation
- Autocomplete and suggestion (see linked case study)
- Saved filters and subscriptions

Technology: Elasticsearch or similar. Discuss:
- Index-per-tenant vs shared index with tenant routing
- Consistency: how quickly do changes appear in search results?
- JQL parsing and query optimization

### 6. Design Real-time Collaboration (Confluence Live Editing)

**Frequency:** Medium-High
**Related:** [[05_case_studies/design_google_docs]]

This is a deeper version of question #2, focused specifically on the real-time layer.

Key areas:
- Conflict resolution: OT (Operational Transformation) vs CRDTs
- WebSocket connection management at scale
- Presence awareness (who is editing what)
- Cursor and selection synchronization
- Offline editing and reconnection
- Document locking vs optimistic concurrency
- Performance with large documents (lazy loading sections)

Atlassian uses a system internally derived from ProseMirror + their own
collaboration backend for Confluence Cloud.

### 7. Design Webhook System

**Frequency:** Medium

Key areas:
- Event generation from product actions (issue created, page updated, PR merged)
- Webhook registration and management API
- Reliable delivery with retries and exponential backoff
- Dead letter queue for persistently failing endpoints
- Payload schema versioning
- Rate limiting per consumer — see [[05_case_studies/design_rate_limiter]]
- Security: HMAC signature verification, IP allowlisting
- Delivery monitoring and debugging dashboard

This connects to Atlassian Connect (their app framework) and Forge (the newer
platform). See [[03_design_patterns/event_sourcing]] for the event backbone.

### 8. Design Plugin / Marketplace System

**Frequency:** Medium

Key areas:
- Plugin lifecycle: install, enable, disable, uninstall
- Sandboxed execution (Forge uses AWS Lambda-style isolation)
- Plugin API surface and backwards compatibility
- Marketplace: discovery, reviews, ratings, licensing
- Resource isolation: plugins should not degrade host product performance
- Permission scoping: plugins request specific permissions (read issues, write pages)
- Versioning and upgrade management
- Multi-tenant plugin state storage

This is Atlassian-specific and tests your knowledge of platform engineering.
Discuss the evolution: Server add-ons (full trust) → Connect (iframe + REST) →
Forge (FaaS sandboxed).

### 9. Design Sprint Board (Real-time Updates)

**Frequency:** Medium

Key areas:
- Board state: columns (statuses), swim lanes, issue cards
- Drag-and-drop reordering with optimistic UI updates
- Real-time sync across multiple users viewing the same board
- Conflict resolution when two users move the same issue simultaneously
- Board configuration (custom columns, filters, WIP limits)
- Performance: boards with hundreds of issues

Technical choices:
- WebSocket or SSE for push updates
- Optimistic concurrency with version vectors
- Event-driven updates via [[02_building_blocks/message_queues]]
- CQRS for read-optimized board views — see [[03_design_patterns/cqrs]]

### 10. Design Permission System (Multi-Tenant)

**Frequency:** Medium

Key areas:
- Hierarchical permissions: Organization → Site → Product → Project → Entity
- Role-based access control (RBAC) with predefined and custom roles
- Permission inheritance and override semantics
- Group and user-level grants
- Cross-product permission consistency
- Performance: permission checks happen on every API call
  - Permission resolution caching — see [[02_building_blocks/caching]]
  - Denormalized permission tables for fast lookup
- Audit logging for compliance
- Admin delegation (project admins vs site admins vs org admins)

Data model challenge: How do you check "Can user X perform action Y on resource Z?"
in under 5ms at the scale of millions of users and billions of resources?

---

## Atlassian-Specific Patterns

### Multi-Tenancy and the Cloud Migration

Atlassian's biggest engineering effort of the past decade has been migrating
customers from self-hosted Server/Data Center to Cloud. This is a goldmine
for interview questions.

**Server model (legacy):**
- Each customer runs their own Jira/Confluence instance
- Dedicated database per customer
- Customers manage their own infrastructure
- Plugins have full access to the host (security nightmare)

**Cloud model (current):**
- Shared infrastructure, logically isolated tenants
- Two approaches coexist:
  - **Database-per-tenant:** Strong isolation, harder to manage at scale
  - **Shared database with tenant ID:** Efficient, requires careful query design
- Atlassian uses a mix: critical data is tenant-isolated, metadata is shared

**Migration challenges (great interview discussion points):**
- Schema differences between Server and Cloud versions
- Data migration without downtime
- Plugin compatibility (Server plugins do not work on Cloud)
- Customer-specific customizations that do not map to multi-tenant model
- Gradual rollout: run both models simultaneously during migration

**Multi-tenancy patterns to know:**

```
┌──────────────────────────────────────────────────────┐
│  Request Flow with Tenant Context                     │
│                                                       │
│  Client → API Gateway → Tenant Resolver → Service    │
│                              │                        │
│                     Extracts tenant ID                │
│                     from JWT / subdomain              │
│                              │                        │
│                     Attaches to request               │
│                     context (propagated               │
│                     through all service calls)        │
│                                                       │
│  Every DB query:  SELECT * FROM issues                │
│                   WHERE tenant_id = ? AND ...         │
│                                                       │
│  Every cache key: tenant:{tid}:issue:{id}            │
│                                                       │
│  Every queue msg: includes tenant_id in header        │
└──────────────────────────────────────────────────────┘
```

### Plugin Architecture Evolution

```
Generation 1: Server Add-ons (2002-2018)
├── Full trust — runs in same JVM as host product
├── Direct database access
├── No isolation — buggy plugin crashes entire instance
└── Thousands of plugins in Marketplace

Generation 2: Atlassian Connect (2013-present)
├── Iframe-based UI integration
├── REST API access with OAuth
├── Runs on developer's own infrastructure
├── Better isolation but still external dependency
└── Webhook-driven event handling

Generation 3: Forge (2020-present)
├── FaaS (Function-as-a-Service) runtime managed by Atlassian
├── Sandboxed execution (no direct internet access by default)
├── Declarative UI with UI Kit
├── Built-in storage API (no external database needed)
├── Best isolation and security model
└── Atlassian handles scaling, monitoring, compliance
```

When discussing plugin systems in interviews, show awareness of this evolution
and the trade-offs at each stage.

### Event-Driven Architecture

Atlassian products are heavily event-driven internally.
See [[03_design_patterns/event_sourcing]].

```
Product Action (e.g., issue status change)
        │
        v
  Event Published to Internal Event Bus
        │
        ├──→ Search Indexer (update Elasticsearch)
        ├──→ Notification Service (trigger alerts)
        ├──→ Webhook Dispatcher (notify external apps)
        ├──→ Analytics Pipeline (track usage metrics)
        ├──→ Audit Log Writer (compliance trail)
        └──→ Cross-product Sync (e.g., Jira ↔ Confluence link)
```

Key design considerations:
- Event schema evolution and backwards compatibility
- At-least-once delivery with idempotent consumers
- Event ordering guarantees (per-entity ordering is usually sufficient)
- Event replay for rebuilding downstream state

### Real-time Collaboration

Atlassian's approach to collaborative editing in Confluence Cloud:

```
Editor Client (ProseMirror-based)
        │
        v
  Collaboration Service
  ├── WebSocket connections (one per active editor)
  ├── Step-based OT (Operational Transformation)
  ├── Central authority for step ordering
  ├── Presence tracking (cursors, selections)
  └── Persistence layer
        │
        ├── Steps stored as event log
        ├── Document snapshots at intervals
        └── Materialized view = snapshot + subsequent steps
```

See [[05_case_studies/design_google_docs]] for the collaborative editing deep dive.

### SaaS Migration Challenges

These make excellent talking points in Atlassian interviews:

1. **Noisy Neighbor Problem**
   - One tenant's heavy usage should not degrade others
   - Solution: per-tenant rate limiting, resource quotas, fair scheduling
   - Reference: [[05_case_studies/design_rate_limiter]]

2. **Data Residency**
   - Enterprise customers require data to stay in specific regions (EU, AU, etc.)
   - Solution: region-pinned tenant data with cross-region metadata

3. **Zero-Downtime Deployments**
   - Cannot take the system down for maintenance like Server customers could
   - Solution: rolling deployments, feature flags, dark launches

4. **Backwards Compatibility**
   - API changes must not break existing integrations
   - Solution: API versioning, deprecation policies, compatibility layers

5. **Customization at Scale**
   - Server customers had unlimited customization freedom
   - Cloud must balance customization with maintainability
   - Solution: well-defined extension points (Forge), not arbitrary modification

---

## Sample Walkthrough — Design Jira

This is the #1 most-asked system design question at Atlassian. Here is a complete
60-minute walkthrough following [[07_interview_framework/the_four_step_framework]].

### Phase 1: Requirements and Scope (0:00 - 0:08)

**Start with clarifying questions (demonstrate collaboration):**

"Before I start designing, I want to make sure we are aligned on scope. Let me
ask a few questions..."

**Functional requirements to confirm:**
- Issue CRUD (create, read, update, delete)
- Custom workflows (e.g., To Do → In Progress → Done, but configurable)
- Project and board management
- Search and filtering (JQL-like)
- Comments and attachments
- Sprint planning and tracking
- Real-time board updates

**Non-functional requirements to discuss:**
- Scale: "How many users and issues are we targeting? Let me assume 10M users,
  500M issues, 50K concurrent users."
- Latency: "Issue reads under 100ms, writes under 500ms, search under 200ms"
- Availability: 99.99% — this is enterprise SaaS
- Multi-tenancy: "Are we designing for cloud multi-tenant?"

**Explicitly scope out (for 60 minutes):**
- Reporting and dashboards
- Third-party integrations (mention but defer)
- Email notifications (mention but defer)

### Phase 2: High-Level Design (0:08 - 0:15)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Clients                                   │
│  (Web App, Mobile App, REST API consumers)                       │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       v
              ┌─────────────────┐
              │   API Gateway    │
              │  (Auth, Routing, │
              │   Rate Limiting) │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────────┐
        v              v                  v
  ┌───────────┐  ┌───────────┐   ┌──────────────┐
  │  Issue     │  │  Workflow  │   │  Board       │
  │  Service   │  │  Engine    │   │  Service     │
  └─────┬─────┘  └─────┬─────┘   └──────┬───────┘
        │               │                │
        v               v                v
  ┌───────────┐  ┌───────────┐   ┌──────────────┐
  │  Issue DB  │  │ Workflow   │   │  Board View  │
  │ (Postgres) │  │ Rules DB   │   │  (Read       │
  │            │  │            │   │   Replica)   │
  └───────────┘  └───────────┘   └──────────────┘
        │
        ├──→ Search Index (Elasticsearch)
        ├──→ Event Bus (Kafka)
        └──→ Cache Layer (Redis)
```

**Explain your choices (invite feedback):**

"I am splitting Issue Service and Workflow Engine because workflow logic is complex
and benefits from independent scaling. What do you think — does this separation
make sense, or would you prefer them combined?"

### Phase 3: Detailed Design (0:15 - 0:35)

#### Data Model

```sql
-- Core issue table
CREATE TABLE issues (
    id              BIGINT PRIMARY KEY,
    tenant_id       UUID NOT NULL,          -- multi-tenancy
    project_id      UUID NOT NULL,
    issue_key       VARCHAR(20) NOT NULL,   -- e.g., "PROJ-1234"
    issue_type      VARCHAR(50) NOT NULL,   -- bug, story, task, epic
    summary         VARCHAR(500) NOT NULL,
    description     TEXT,
    status_id       UUID NOT NULL,          -- FK to workflow_statuses
    priority        SMALLINT,
    assignee_id     UUID,
    reporter_id     UUID NOT NULL,
    sprint_id       UUID,
    story_points    SMALLINT,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    version         BIGINT NOT NULL DEFAULT 1,  -- optimistic concurrency

    INDEX idx_tenant_project (tenant_id, project_id),
    INDEX idx_tenant_assignee (tenant_id, assignee_id),
    INDEX idx_tenant_sprint (tenant_id, sprint_id)
);

-- Issue key generation (per project, per tenant)
CREATE TABLE issue_key_sequences (
    tenant_id       UUID NOT NULL,
    project_id      UUID NOT NULL,
    next_number     BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (tenant_id, project_id)
);

-- Workflow definition
CREATE TABLE workflows (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    name            VARCHAR(200) NOT NULL,
    is_default      BOOLEAN DEFAULT FALSE
);

CREATE TABLE workflow_statuses (
    id              UUID PRIMARY KEY,
    workflow_id     UUID NOT NULL,
    name            VARCHAR(100) NOT NULL,  -- "To Do", "In Progress", "Done"
    category        VARCHAR(20) NOT NULL    -- "todo", "in_progress", "done"
);

CREATE TABLE workflow_transitions (
    id              UUID PRIMARY KEY,
    workflow_id     UUID NOT NULL,
    from_status_id  UUID NOT NULL,
    to_status_id    UUID NOT NULL,
    name            VARCHAR(100) NOT NULL,  -- "Start Progress", "Resolve"
    conditions      JSONB                   -- optional rules
);

-- Comments
CREATE TABLE comments (
    id              BIGINT PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    issue_id        BIGINT NOT NULL,
    author_id       UUID NOT NULL,
    body            TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL
);
```

**Discuss key decisions:**

"I am using `tenant_id` as the first column in every composite index because
every query in a multi-tenant system is scoped to a tenant. This also enables
potential future sharding by tenant."

"For issue keys like PROJ-1234, I use a separate sequence table with
SELECT FOR UPDATE to guarantee uniqueness within a project. This is a hot path
but acceptable since issue creation is not as frequent as reads."

#### API Design

```
POST   /api/v1/issues                    — Create issue
GET    /api/v1/issues/{issueKey}         — Get issue by key
PUT    /api/v1/issues/{issueKey}         — Update issue
DELETE /api/v1/issues/{issueKey}         — Delete issue
POST   /api/v1/issues/{issueKey}/transitions/{transitionId}  — Transition status
GET    /api/v1/search?jql={query}        — Search issues
GET    /api/v1/boards/{boardId}          — Get board with issues
```

#### Workflow Engine

```
Transition Request
        │
        v
  Validate: Is this transition allowed from current status?
        │
        v
  Check conditions (e.g., "only assignee can resolve")
        │
        v
  Execute transition:
    1. Update issue status (with optimistic locking)
    2. Publish event: IssueTransitioned
    3. Run post-functions (e.g., auto-assign, send notification)
        │
        v
  Event consumers:
    ├── Update search index
    ├── Update board view (via WebSocket push)
    ├── Trigger notifications
    └── Fire webhooks
```

#### Real-time Board Updates

"For the sprint board, I would use a CQRS pattern — see [[03_design_patterns/cqrs]].
Writes go through the Issue Service, which publishes events. A Board Projection
service consumes these events and maintains a denormalized read model optimized
for board rendering."

```
Issue Service (writes)  ──→  Kafka  ──→  Board Projection Service
                                                    │
                                                    v
                                         Board Read Store (Redis)
                                                    │
                                                    v
                                         WebSocket Gateway
                                                    │
                                                    v
                                         Connected Clients
```

"When a user drags a card on the board, we do an optimistic UI update immediately,
send the transition request to the backend, and if it fails (e.g., permission
denied, workflow violation), we revert the UI."

### Phase 4: Deep Dives and Scaling (0:35 - 0:58)

#### Search (JQL)

"Jira's search is powered by JQL — a structured query language. Example:
`project = PROJ AND status = 'In Progress' AND assignee = currentUser()`"

- Parse JQL into an AST (Abstract Syntax Tree)
- Translate AST to Elasticsearch query DSL
- Multi-tenant: route queries to tenant-specific index or use tenant_id filter
- Index updates: consume events from Kafka, update Elasticsearch near-real-time
- For autocomplete and suggestions, see [[05_case_studies/design_search_autocomplete]]

#### Multi-Tenant Scaling

"For scaling, I would shard by tenant_id. Large tenants (enterprise customers)
get dedicated shards. Smaller tenants share shards."

```
Tenant Routing:
  Small tenant  → Shared shard (tenant_id-based routing)
  Large tenant  → Dedicated shard (or even dedicated database)

Shard Map Service:
  tenant_id → { shard_id, db_host, cache_prefix }
  Cached in every service instance, updated via pub/sub
```

#### Caching Strategy

See [[02_building_blocks/caching]].

```
Cache layers:
  L1: Application-level in-memory cache (per instance, short TTL)
  L2: Redis cluster (shared across instances, moderate TTL)
  L3: Database with read replicas

Cache key patterns:
  issue:{tenant_id}:{issue_key}  → Full issue object
  board:{tenant_id}:{board_id}   → Board view with all cards
  workflow:{tenant_id}:{id}      → Workflow definition (rarely changes)

Invalidation:
  Event-driven: On IssueUpdated event, invalidate relevant cache keys
  TTL-based: Workflow definitions use long TTL since they change infrequently
```

#### Failure and Recovery

"I want to address what happens when things go wrong — this relates to
'Don't #@!% the customer'..."

- **Database failure:** Read replicas + automatic failover. Board reads continue
  from cache and read replicas even if primary is down.
- **Search index lag:** Show a banner "search results may be slightly delayed"
  rather than showing stale results silently.
- **Event bus failure:** Issue writes succeed (they go to the primary DB first).
  Events are durably stored and replayed when the bus recovers.

### Closing

"If we had more time, I would love to discuss the permission system in more depth,
the plugin extensibility layer, and how we would handle data migration for
customers moving from Server to Cloud. Would you like to dive into any of those?"

---

## Red Flags and Green Flags

Understanding what Atlassian interviewers look for — and what makes them
write a "no hire."

See also [[07_interview_framework/common_red_flags]] for general patterns.

### Red Flags (Strong No Signals)

| Red Flag | Why It Matters at Atlassian |
|----------|---------------------------|
| Monologuing without checking in | Violates "Play, as a team" |
| Dismissing interviewer suggestions | Signals inability to collaborate |
| Never saying "I don't know" | Violates "Open company, no bullshit" |
| Jumping to solution without requirements | Shows poor problem structuring |
| Over-engineering without justification | Violates "Build with heart and balance" |
| Ignoring customer impact | Violates "Don't #@!% the customer" |
| No mention of multi-tenancy | Missing Atlassian's core architectural challenge |
| No consideration of operational complexity | Suggests "throw it over the wall" mentality |
| Arrogance or competitiveness toward interviewer | Immediate disqualifier at a values-driven company |
| Treating the interview as a test, not a conversation | Misunderstands the format entirely |

### Green Flags (Strong Hire Signals)

| Green Flag | Why It Matters at Atlassian |
|-----------|---------------------------|
| Asks "what do you think?" genuinely | Demonstrates real collaboration |
| Admits gaps and reasons through them | Shows intellectual honesty |
| Starts from user needs, not tech | Customer-first thinking |
| Discusses trade-offs before picking | Shows maturity and balance |
| Mentions multi-tenancy proactively | Understands Atlassian's architecture |
| Considers plugin/extension points | Thinks about platform, not just product |
| Discusses observability and operability | "Run what you build" mindset |
| Incorporates feedback and adapts | Coachable, team-oriented |
| Proposes incremental rollout strategy | "Be the change" — practical execution |
| References Atlassian products naturally | Shows genuine interest in the company |

### The Collaboration Spectrum

```
Strong No Hire                                    Strong Hire
     |                                                 |
     v                                                 v
  Monologue ──── Present ──── Discuss ──── Co-create ──── Partner
     │              │             │             │              │
  Ignores      Tolerates     Considers    Integrates     Builds on
  interviewer  questions     suggestions  feedback       ideas together
```

Aim for the right end of this spectrum. The interviewer's notes will explicitly
mention your collaboration quality.

---

## Preparation Checklist

### 2-4 Weeks Before

- [ ] **Study Atlassian's 5 values** — Memorize them. Internalize them.
      They will be evaluated in every single round.
- [ ] **Prepare 8-10 STAR stories** that map to multiple values.
      Focus on: collaboration, customer impact, honest communication,
      initiative, pragmatic trade-offs.
- [ ] **Review Atlassian products** — Use free tiers of Jira, Confluence,
      and Bitbucket. Understand the UX you would be designing.
- [ ] **Study multi-tenancy patterns** — This is Atlassian's bread and butter.
      Understand tenant isolation, noisy neighbor, data residency.
- [ ] **Practice the Jira design** — It is the most likely question.
      Use the walkthrough above. Time yourself to 60 minutes.
- [ ] **Review key building blocks:**
      - [[02_building_blocks/caching]]
      - [[02_building_blocks/message_queues]]
      - [[02_building_blocks/search_systems]]
- [ ] **Review design patterns:**
      - [[03_design_patterns/event_sourcing]]
      - [[03_design_patterns/cqrs]]
- [ ] **Study case studies for overlap:**
      - [[05_case_studies/design_google_docs]] (for Confluence collab)
      - [[05_case_studies/design_notification_system]]
      - [[05_case_studies/design_search_autocomplete]] (for JQL search)
      - [[05_case_studies/design_rate_limiter]] (for multi-tenant throttling)

### 1 Week Before

- [ ] **Practice 3 full mock interviews** (60 min each) with a partner.
      Focus on collaboration: ask for input, incorporate feedback.
- [ ] **Review latency numbers** — See [[08_reference/latency_numbers]].
      Be able to cite them naturally in your design.
- [ ] **Practice the values interview** — Record yourself telling your STAR
      stories. Are they concise? Do they clearly connect to Atlassian's values?
- [ ] **Research your interviewers** on LinkedIn. Know their teams and products.
- [ ] **Read recent Atlassian engineering blog posts** — They publish extensively
      about their architecture, migration challenges, and technical decisions.
      Reference these in interviews for bonus points.

### Day Before

- [ ] **Review your top 3 STAR stories** — Keep them fresh but not memorized
      word-for-word. Natural delivery is more convincing.
- [ ] **Review the Jira walkthrough** one more time.
- [ ] **Prepare 3-4 thoughtful questions** for each interviewer:
      - "What is the biggest technical challenge your team faces right now?"
      - "How has the Server-to-Cloud migration affected your team's architecture?"
      - "How do you balance platform consistency with individual product needs?"
      - "What does the Forge adoption curve look like for your product area?"
- [ ] **Test your setup** — Camera, microphone, whiteboard tool (if virtual).

### During the Interview

- [ ] **Clarify before designing** — 5-8 minutes of questions is expected.
- [ ] **Check in every 5-7 minutes** — "Does this direction make sense to you?"
- [ ] **Name your trade-offs explicitly** — "The trade-off here is X vs Y.
      I am leaning toward X because..."
- [ ] **Connect to Atlassian context** — "This is similar to how Jira handles..."
- [ ] **Mention multi-tenancy** proactively if the question involves any
      SaaS system.
- [ ] **Discuss operability** — Monitoring, alerting, debugging, deployment.
- [ ] **Save 2 minutes at the end** for questions.

### Additional Resources

- Atlassian Engineering Blog: engineering.atlassian.com
- Atlassian Developer Documentation: developer.atlassian.com
- Atlassian's values page: atlassian.com/company/values
- Forge platform documentation: developer.atlassian.com/platform/forge/
- Atlassian's migration documentation (Server to Cloud architecture)

---

> **Key Takeaway:** Atlassian interviews are fundamentally about collaboration.
> Your technical design must be sound, but HOW you arrive at it matters as much
> as WHAT you arrive at. Treat the interviewer as a teammate, be honest about
> what you know and do not know, and always connect your decisions back to
> customer impact.

---

> **Navigation:** [[17_company_interview_guide/index]] | [[07_interview_framework/the_four_step_framework]] | [[07_interview_framework/common_red_flags]]
