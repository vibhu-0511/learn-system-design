# Microsoft — System Design Interview Guide

> **Navigation:** [[17_company_interview_guide/index]] | [[07_interview_framework/the_four_step_framework]]
>
> *"At Microsoft, we have this very rich, deeply-held belief in the growth mindset."*
> — Satya Nadella

---

## 1. Company Overview

### 1.1 Why Microsoft in 2025-2026

Microsoft is the **world's most valuable company** (market cap ~$3.2T+). Under Satya Nadella,
the company pivoted from a Windows-centric model to a cloud-first, AI-first strategy.
Key revenue pillars:

- **Azure** — Second-largest cloud, growing 30%+ YoY
- **Microsoft 365** — 400M+ paid seats (Teams, Office, SharePoint)
- **LinkedIn** — 1B+ members
- **Gaming** — Xbox + Activision Blizzard ($69B acquisition)
- **GitHub + Dev Tools** — 100M+ developers
- **Copilot / AI** — OpenAI partnership, embedded across all products

### 1.2 Engineering Levels

Microsoft uses a numeric level system. IC (Individual Contributor) and Management tracks
diverge at Level 63.

| Level | Title                   | YoE (Typical) | Scope                        |
|-------|-------------------------|----------------|------------------------------|
| 59    | SDE I                   | 0-2            | Task-level, guided work      |
| 60    | SDE I (senior new grad) | 1-3            | Task-level, some autonomy    |
| 61    | SDE II                  | 2-5            | Feature-level ownership      |
| 62    | Senior SDE              | 4-8            | Component/system ownership   |
| 63    | Senior SDE              | 6-12           | Cross-team influence         |
| 64    | Principal SDE           | 8-15           | Org-wide technical strategy  |
| 65    | Principal SDE           | 10-18          | Division-wide impact         |
| 66    | Partner SDE             | 15+            | Company-wide impact          |
| 67    | Distinguished Engineer  | 20+            | Industry-wide impact         |

> **Note:** Level 63 is the "senior ceiling" — the promotion from 63 to 64 (Principal) is
> one of the hardest in the industry. System design interviews are critical for L62+.

### 1.3 Compensation — India

All figures in INR Lakhs Per Annum (LPA). Includes base + bonus + stock (annualized).

| Level | Title        | Hyderabad / Noida      | Bangalore              |
|-------|--------------|------------------------|------------------------|
| 59    | SDE I        | 22-32 LPA              | 24-35 LPA              |
| 60    | SDE I        | 28-40 LPA              | 30-45 LPA              |
| 61    | SDE II       | 38-58 LPA              | 42-65 LPA              |
| 62    | Senior SDE   | 55-85 LPA              | 60-95 LPA              |
| 63    | Senior SDE   | 75-1.1 Cr              | 80-1.2 Cr              |
| 64    | Principal    | 1.0-1.6 Cr             | 1.1-1.8 Cr             |
| 65    | Principal    | 1.4-2.2 Cr             | 1.5-2.5 Cr             |

> **India notes:**
> - Hyderabad campus (MSIDC) is the largest outside Redmond — ~10,000+ engineers.
> - Noida and Bangalore offices are growing rapidly, especially for Azure and M365.
> - Stock vests over 4 years with a slight backload (25/25/25/25 but refreshers tilt later).
> - Annual bonuses range from 0-20% of base depending on level and review.

### 1.4 Compensation — United States

All figures in USD. Total Compensation (TC) = Base + Bonus + Stock (annualized).

| Level | Title        | Redmond, WA            | Bay Area (LinkedIn/GitHub) |
|-------|--------------|------------------------|----------------------------|
| 59    | SDE I        | $120K-$160K TC         | $140K-$180K TC             |
| 60    | SDE I        | $140K-$185K TC         | $155K-$205K TC             |
| 61    | SDE II       | $175K-$250K TC         | $200K-$280K TC             |
| 62    | Senior SDE   | $240K-$370K TC         | $270K-$420K TC             |
| 63    | Senior SDE   | $320K-$470K TC         | $360K-$530K TC             |
| 64    | Principal    | $430K-$650K TC         | $480K-$720K TC             |
| 65    | Principal    | $550K-$850K TC         | $600K-$950K TC             |
| 66    | Partner      | $800K-$1.3M TC         | $900K-$1.5M TC             |

> **US notes:**
> - Redmond has no state income tax (Washington state) — massive advantage over CA.
> - Bay Area roles are primarily LinkedIn (Sunnyvale) and GitHub (SF).
> - Stock is granted annually as "refresh" in addition to initial grant.
> - Microsoft 401(k) match is 50% up to IRS limit — one of the best in tech.

### 1.5 Culture — Growth Mindset

Microsoft's cultural transformation under Nadella is built on three pillars:

1. **Growth Mindset** — "Learn-it-all" beats "know-it-all." Interviewers look for
   curiosity and willingness to iterate, not perfect answers.
2. **Customer Obsession** — Enterprise customers drive decisions. Your designs
   should always consider the paying customer.
3. **One Microsoft** — Cross-team collaboration. Siloed thinking is discouraged.
   Designs should consider how they fit into the broader ecosystem.

### 1.6 Team Structure

```
CVP (Corporate Vice President)
 └── VP Engineering
      └── Partner Director / Partner SDE
           └── Engineering Manager (owns ~8-12 engineers)
                ├── Principal SDE (tech lead, L64-65)
                ├── Senior SDE (L62-63) × 2-3
                ├── SDE II (L61) × 3-4
                └── SDE I (L59-60) × 1-2
```

Major engineering orgs:
- **Cloud + AI** (Azure, AI Platform) — Largest, fastest-growing
- **Experiences + Devices** (Windows, Surface, M365 apps)
- **Security** — Rapidly expanding post-SolarWinds
- **LinkedIn** — Operates semi-independently
- **Gaming** — Xbox + Activision

---

## 2. Interview Process

### 2.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSOFT INTERVIEW PIPELINE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Referral / Application                                         │
│       │                                                         │
│       ▼                                                         │
│  Recruiter Screen (30 min) ─── Fit, level calibration           │
│       │                                                         │
│       ▼                                                         │
│  Phone Screen (45-60 min) ─── Coding or System Design           │
│       │                                                         │
│       ▼                                                         │
│  Onsite / Virtual Loop (4-5 rounds)                             │
│       │                                                         │
│       ├── Round 1: Coding (45-60 min)                           │
│       ├── Round 2: Coding + Problem Solving (45-60 min)         │
│       ├── Round 3: System Design (45-60 min) ← THIS GUIDE      │
│       ├── Round 4: Behavioral / Culture Fit (45-60 min)         │
│       └── Round 5: "AA" — As Appropriate (Hiring Manager)       │
│       │                                                         │
│       ▼                                                         │
│  Debrief + Offer (1-2 weeks)                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Differences from Google/Meta

| Aspect               | Microsoft                    | Google             | Meta               |
|----------------------|------------------------------|--------------------|--------------------|
| System Design Rounds | 1 (sometimes 2 for L63+)    | 1-2                | 1                  |
| Depth vs Breadth     | **Breadth-focused**          | Deep-dive          | Product + Tech     |
| LLD Questions        | **Yes, still common**        | Rare               | Rare               |
| Azure Knowledge      | Bonus, not required          | N/A                | N/A                |
| Behavioral Focus     | High (growth mindset)        | Medium             | High               |
| "AA" Round           | **Unique — final boss**      | No equivalent      | No equivalent      |
| Coding Language      | Any (C# is a plus)          | Any                | Any                |
| Offer Timeline       | 1-2 weeks post-loop          | 2-6 weeks          | 1-3 weeks          |

### 2.3 The "As Appropriate" (AA) Round

The AA round is **unique to Microsoft**. It is the final interview conducted by the hiring
manager (or a senior leader). Key things to know:

- The AA interviewer has access to **all prior feedback** from earlier rounds.
- They may **probe weaknesses** identified by other interviewers.
- The AA has **veto power** — a "No Hire" from AA overrides everything.
- It often includes behavioral + technical hybrid questions.
- If you reach the AA round, you are likely **leaning toward an offer** — but not guaranteed.

### 2.4 Timeline

| Stage                | Duration           |
|----------------------|--------------------|
| Application → Screen | 1-3 weeks          |
| Screen → Onsite      | 1-2 weeks          |
| Onsite Day           | 1 day (4-5 hours)  |
| Onsite → Decision    | 3-7 business days   |
| Decision → Offer     | 2-5 business days   |
| **Total End-to-End** | **4-8 weeks**       |

---

## 3. System Design Round Details

### 3.1 Format

- **Duration:** 45-60 minutes
- **Structure:** Open-ended problem → your design → interviewer probing
- **Whiteboard:** Physical (onsite) or virtual (Teams whiteboard / draw.io)
- **Expected for:** L61+ (SDE II and above). L59-60 may get a lighter version.

### 3.2 What Microsoft Evaluates

```
┌─────────────────────────────────────────────────────────────────┐
│              MICROSOFT EVALUATION RUBRIC (SYSTEM DESIGN)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REQUIREMENTS GATHERING (15%)                                │
│     - Do you ask clarifying questions?                          │
│     - Do you define scope and constraints?                      │
│     - Do you consider enterprise vs consumer scenarios?         │
│                                                                 │
│  2. HIGH-LEVEL DESIGN (25%)                                     │
│     - Clean component breakdown                                 │
│     - Logical data flow                                         │
│     - API design                                                │
│                                                                 │
│  3. DETAILED DESIGN (25%)                                       │
│     - Schema design                                             │
│     - Key algorithms and data structures                        │
│     - Trade-off analysis with justification                     │
│                                                                 │
│  4. SCALABILITY & RELIABILITY (20%)                             │
│     - Horizontal scaling strategy                               │
│     - Fault tolerance and redundancy                            │
│     - Caching, CDN, load balancing                              │
│     - See [[08_reference/latency_numbers]]                      │
│                                                                 │
│  5. PRAGMATISM & COMMUNICATION (15%)                            │
│     - Real-world trade-offs (not theoretical perfection)        │
│     - Enterprise awareness (compliance, multi-tenancy)          │
│     - Clear communication throughout                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Microsoft's Pragmatic Approach

Microsoft interviewers tend to be **more practical** than Google interviewers:

- They care about "what would actually ship" over theoretical elegance.
- Mentioning Azure services is a **nice-to-have** but not expected.
- Enterprise concerns (multi-tenancy, compliance, SLAs) earn bonus points.
- They appreciate trade-off discussions: "We could use X for lower latency, but Y
  gives us better durability. Given the requirements, I'd pick Y because..."
- **Back-of-envelope math** matters — see [[07_interview_framework/estimation_cheat_sheet]].

### 3.4 Time Allocation

Use the [[07_interview_framework/the_four_step_framework]]:

| Phase                     | Time     | Microsoft Focus                        |
|---------------------------|----------|----------------------------------------|
| Requirements & Scope      | 5-8 min  | Enterprise vs consumer, scale numbers  |
| High-Level Design         | 10-15 min| Clean boxes-and-arrows, API surface    |
| Deep Dive                 | 15-20 min| Storage, caching, messaging, trade-offs|
| Scaling & Wrap-up         | 5-10 min | Reliability, monitoring, edge cases    |

---

## 4. Top 10 Most-Asked Questions

### 4.1 High-Level Design (HLD) Questions

| #  | Question                         | Vault Reference                                       | Frequency |
|----|----------------------------------|-------------------------------------------------------|-----------|
| 1  | Design Microsoft Teams           | [[05_case_studies/design_zoom]]                       | Very High |
| 2  | Design OneDrive / SharePoint     | [[05_case_studies/design_google_docs]]                | Very High |
| 3  | Design Azure CDN                 | [[02_building_blocks/cdn]]                            | High      |
| 4  | Design Distributed Cache         | [[05_case_studies/design_distributed_cache]]           | High      |
| 5  | Design URL Shortener             | [[05_case_studies/design_url_shortener]]               | High      |
| 6  | Design Notification Hub          | [[05_case_studies/design_notification_system]]         | High      |
| 7  | Design Bing Search Autocomplete  | [[05_case_studies/design_search_autocomplete]]         | Medium    |
| 8  | Design Azure Service Bus         | [[02_building_blocks/message_queues]]                  | Medium    |

### 4.2 Low-Level Design (LLD) Questions

Microsoft is **one of the few top companies** that still asks LLD / OOP design questions,
especially for L59-L62 candidates.

| #  | Question                     | Key Concepts                                        | Frequency |
|----|------------------------------|-----------------------------------------------------|-----------|
| 9  | Design Parking Lot           | OOP, Strategy pattern, State machine                | High      |
| 10 | Design Elevator System       | OOP, Observer pattern, Scheduling algorithms        | Medium    |

### 4.3 Quick Notes on Each Question

**1. Design Microsoft Teams** → [[05_case_studies/design_zoom]]
- Covers real-time messaging, video calling, file sharing, presence.
- Microsoft expects you to think about **channels, threads, @mentions**.
- Consider integration with Office 365 ecosystem.
- Key: WebSocket for real-time, SFU/MCU for video, blob storage for files.

**2. Design OneDrive / SharePoint** → [[05_case_studies/design_google_docs]]
- File sync, version history, real-time co-authoring.
- Think about **chunked upload, conflict resolution, delta sync**.
- Enterprise features: permissions, compliance holds, DLP.

**3. Design Azure CDN** → [[02_building_blocks/cdn]]
- PoP (Point of Presence) architecture, cache invalidation, origin shielding.
- Consider **custom domain support, SSL termination, WAF integration**.

**4. Design Distributed Cache (Azure Redis)** → [[05_case_studies/design_distributed_cache]]
- Consistent hashing, eviction policies, replication.
- **Multi-region** cache coherence is a favorite deep-dive topic.
- See also [[02_building_blocks/caching]].

**5. Design URL Shortener** → [[05_case_studies/design_url_shortener]]
- Classic question. Base62 encoding, 301 vs 302 redirects, analytics.
- Microsoft may ask about **enterprise link tracking** (click analytics for marketing).

**6. Design Notification Hub** → [[05_case_studies/design_notification_system]]
- Push (APNS, FCM, WNS), email, SMS, in-app.
- Think about **fan-out, rate limiting, user preferences, cross-platform**.
- Azure Notification Hubs is a real product — knowing its architecture helps.

**7. Design Bing Search Autocomplete** → [[05_case_studies/design_search_autocomplete]]
- Trie-based suggestions, ranking by popularity, personalization.
- Consider **real-time trending queries, spell correction, safe search**.

**8. Design Azure Service Bus** → [[02_building_blocks/message_queues]]
- Topics/subscriptions, dead letter queues, exactly-once delivery.
- Discuss **ordering guarantees, sessions, transactions**.

**9. Design Parking Lot (LLD)**
- Classes: ParkingLot, Floor, Spot, Vehicle (Car, Truck, Motorcycle).
- Patterns: Strategy (pricing), State (spot availability), Factory (vehicle creation).
- APIs: `enter()`, `exit()`, `findSpot()`, `calculateFee()`.

**10. Design Elevator System (LLD)**
- Classes: ElevatorSystem, Elevator, Request, Scheduler.
- Scheduling: SCAN (elevator algorithm), LOOK, Nearest-First.
- Patterns: Observer (floor buttons notify scheduler), State (elevator states).

---

## 5. Microsoft-Specific Patterns

### 5.1 Azure Ecosystem Awareness

You do NOT need to be an Azure expert, but knowing these services and when to use them
shows cultural alignment.

```
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE SERVICES CHEAT SHEET                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMPUTE                                                        │
│  ├── Azure App Service ─── Managed web apps (PaaS)              │
│  ├── Azure Functions ──── Serverless (event-driven)             │
│  ├── AKS ──────────────── Managed Kubernetes                    │
│  └── Azure VMs ────────── IaaS (full control)                   │
│                                                                 │
│  STORAGE                                                        │
│  ├── Azure Blob Storage ── Object store (like S3)               │
│  ├── Azure SQL ─────────── Managed SQL Server                   │
│  ├── Cosmos DB ─────────── Global NoSQL (multi-model)           │
│  ├── Azure Table Storage ── Key-value (cheap, simple)           │
│  └── Azure Data Lake ───── Big data analytics                   │
│                                                                 │
│  MESSAGING                                                      │
│  ├── Azure Service Bus ─── Enterprise message broker            │
│  ├── Event Hubs ────────── High-throughput event streaming      │
│  ├── Event Grid ────────── Reactive event routing               │
│  └── Azure Queue Storage ── Simple FIFO queues                  │
│                                                                 │
│  CACHING & CDN                                                  │
│  ├── Azure Cache for Redis ── Managed Redis                     │
│  └── Azure CDN ──────────── Content delivery                    │
│                                                                 │
│  AI / ML                                                        │
│  ├── Azure OpenAI Service ── GPT-4, embeddings                  │
│  ├── Azure ML ────────────── MLOps platform                     │
│  └── Cognitive Services ──── Vision, Speech, Language            │
│                                                                 │
│  IDENTITY & SECURITY                                            │
│  ├── Azure AD (Entra ID) ── Identity provider                   │
│  ├── Key Vault ──────────── Secrets management                  │
│  └── Azure Sentinel ─────── SIEM / security analytics          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Cosmos DB — Microsoft's Favorite Database

Cosmos DB appears in a disproportionate number of Microsoft system design discussions.
Key features to know:

- **Multi-model:** Document, graph, key-value, column-family, table.
- **Global distribution:** Turnkey multi-region writes with 5 consistency levels.
- **Consistency spectrum:** Strong → Bounded Staleness → Session → Consistent Prefix → Eventual.
- **Partition key:** Critical design decision. Bad partition key = hot partitions.
- **RU/s pricing:** Request Units per second. Throughput = money.
- **Change Feed:** Stream of changes for event-driven architectures.

When to mention Cosmos DB in interviews:
- Global user base needing low-latency reads everywhere.
- Flexible schema requirements.
- Need for multiple consistency levels per operation.

### 5.3 .NET / C# Awareness

Microsoft is a **.NET shop** at its core (though they use many languages). You do NOT
need to code in C#, but knowing these concepts helps:

- **ASP.NET Core** — Their primary web framework.
- **gRPC** — Used extensively for internal service-to-service communication.
- **SignalR** — Real-time library (WebSocket abstraction) used in Teams, Office.
- **Orleans** — Virtual actor framework for distributed systems (used in Halo, Azure).
- **YARP** — Reverse proxy library (Yet Another Reverse Proxy).

### 5.4 Enterprise-Grade Reliability

Microsoft serves governments, banks, hospitals. Their bar for reliability is extreme.

| Concern                  | What Microsoft Expects You to Discuss              |
|--------------------------|-----------------------------------------------------|
| **SLAs**                 | 99.95% to 99.999% — know what each means in downtime|
| **Compliance**           | GDPR, HIPAA, SOC 2, FedRAMP, data residency        |
| **Multi-tenancy**        | Tenant isolation, noisy-neighbor prevention          |
| **Backward Compat**      | APIs must support N-2 versions minimum               |
| **Data Sovereignty**     | Data must stay in-region for some customers          |
| **Disaster Recovery**    | RPO/RTO targets, active-active vs active-passive     |

SLA downtime reference:

| SLA       | Downtime / Year | Downtime / Month |
|-----------|-----------------|------------------|
| 99%       | 3.65 days       | 7.3 hours        |
| 99.9%     | 8.76 hours      | 43.8 minutes     |
| 99.95%    | 4.38 hours      | 21.9 minutes     |
| 99.99%    | 52.6 minutes    | 4.38 minutes     |
| 99.999%   | 5.26 minutes    | 26.3 seconds     |

### 5.5 Multi-Tenant SaaS Architecture

Almost every Microsoft product is multi-tenant. Show you understand:

```
┌─────────────────────────────────────────────────────────────────┐
│                 MULTI-TENANCY ISOLATION MODELS                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Model 1: SHARED EVERYTHING                                     │
│  ┌──────────────────────────────┐                               │
│  │   Shared App + Shared DB     │  ← Cheapest, noisiest        │
│  │   TenantID column in tables  │                               │
│  └──────────────────────────────┘                               │
│                                                                 │
│  Model 2: SHARED APP, SEPARATE DB                               │
│  ┌──────────────────────────────┐                               │
│  │   Shared App Layer           │  ← Good balance               │
│  │   Per-tenant database        │                               │
│  └──────────────────────────────┘                               │
│                                                                 │
│  Model 3: FULLY ISOLATED                                        │
│  ┌──────────────────────────────┐                               │
│  │   Per-tenant app + DB        │  ← Enterprise / Gov clouds    │
│  │   (Azure Gov, Air-gapped)    │                               │
│  └──────────────────────────────┘                               │
│                                                                 │
│  Microsoft typically uses Model 1 or 2 for commercial,          │
│  and Model 3 for government / regulated industries.             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.6 Backward Compatibility Obsession

Microsoft has a legendary commitment to backward compatibility. In interviews:

- Always version your APIs: `/api/v1/resource`, `/api/v2/resource`.
- Discuss **additive changes** vs **breaking changes**.
- Mention feature flags for gradual rollouts.
- Talk about supporting older clients — Microsoft supports Windows 10 alongside
  Windows 11, Office 2019 alongside Office 365.
- Consider the **deprecation lifecycle**: Announce → 12-month warning → sunset.

### 5.7 Circuit Breaker and Resilience

Microsoft invented or popularized many resilience patterns used in Azure.
See [[03_design_patterns/circuit_breaker]].

- **Circuit Breaker** — Prevent cascading failures.
- **Retry with Exponential Backoff** — Handle transient failures.
- **Bulkhead** — Isolate failures to prevent spreading.
- **Throttling** — Protect services from overload (HTTP 429).
- **Queue-Based Load Leveling** — Buffer spikes with message queues.

See also: [[15_intermediate_topics/cloud_architecture_patterns]]

---

## 6. Sample Walkthrough: Design Microsoft Teams

This walkthrough follows the [[07_interview_framework/the_four_step_framework]].
Cross-reference with [[05_case_studies/design_zoom]] for video components and
[[05_case_studies/design_chat_system]] for messaging.

### Step 1: Requirements & Scope (5-8 min)

**Functional Requirements:**
- 1:1 and group text messaging (with threads)
- Channels within teams/organizations
- Audio and video calling (1:1 and group, up to 300 participants)
- File sharing and co-editing (integrated with OneDrive/SharePoint)
- Presence indicators (online, away, busy, DND, offline)
- Push notifications across devices
- Screen sharing

**Non-Functional Requirements:**
- Message delivery latency: < 200ms (same region)
- Video call join time: < 3 seconds
- 99.99% availability (Microsoft's actual Teams SLA is 99.99%)
- Support 300M+ monthly active users
- Multi-tenant: thousands of organizations, isolated data
- Compliance: message retention, e-discovery, DLP

**Scale Estimates** (using [[07_interview_framework/estimation_cheat_sheet]]):
- 300M MAU, 150M DAU
- Average user sends 50 messages/day → 7.5B messages/day → ~87K messages/sec
- Peak: 3x average → ~260K messages/sec
- Storage: 50 messages × 200 bytes avg × 300M users/month ≈ 3TB/month for messages
- Concurrent video calls at peak: ~5M simultaneous calls

### Step 2: High-Level Design (10-15 min)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MICROSOFT TEAMS — HIGH-LEVEL ARCHITECTURE           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────────────┐    │
│  │  Clients  │────▶│  API Gateway │────▶│  Auth Service            │    │
│  │ (Web/Mob/ │     │  + LB        │     │  (Azure AD / Entra ID)   │    │
│  │  Desktop) │     └──────┬───────┘     └──────────────────────────┘    │
│  └──────────┘            │                                              │
│       │                  ▼                                              │
│       │         ┌────────────────┐                                      │
│       │         │  Routing Layer │                                      │
│       │         └──┬────┬────┬──┘                                      │
│       │            │    │    │                                           │
│       │    ┌───────▼┐ ┌▼────▼──────┐  ┌──────────────┐                 │
│       │    │ Chat   │ │ Presence   │  │ Calling      │                 │
│       │    │ Service│ │ Service    │  │ Service      │                 │
│       │    └───┬────┘ └─────┬──────┘  └──────┬───────┘                 │
│       │        │            │                │                          │
│       │   ┌────▼─────┐  ┌──▼───────┐  ┌─────▼────────┐                │
│       │   │ Message   │  │ Redis    │  │ Media Relay  │                │
│       │   │ Store     │  │ Cluster  │  │ (SFU/TURN)   │                │
│       │   │(Cosmos DB)│  │          │  │              │                │
│       │   └──────────┘  └──────────┘  └──────────────┘                │
│       │                                                                 │
│  WebSocket ←──── SignalR / WebSocket Gateway ──────────────────────     │
│  (real-time)     (pushes messages, presence, call signals to clients)   │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐       │
│  │ Notification   │  │ File Service   │  │ Search Service      │       │
│  │ Service        │  │ (OneDrive/     │  │ (Elasticsearch /    │       │
│  │                │  │  Blob Storage) │  │  Azure Search)      │       │
│  └────────────────┘  └────────────────┘  └─────────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Core APIs:**

```
POST   /api/v1/teams/{teamId}/channels/{channelId}/messages
GET    /api/v1/teams/{teamId}/channels/{channelId}/messages?before={ts}&limit=50
POST   /api/v1/calls/start         { participants: [...], type: "video" }
PUT    /api/v1/presence             { status: "available" }
WS     /api/v1/realtime/connect     (WebSocket for real-time updates)
```

### Step 3: Deep Dive (15-20 min)

**3a. Messaging Pipeline**

```
Client sends message
    │
    ▼
API Gateway → Chat Service
    │
    ├──▶ Write to Cosmos DB (partition key = channelId)
    │         └── Async: Index in search service
    │
    ├──▶ Publish to message bus (Event Hubs / Service Bus)
    │         │
    │         ├──▶ Fan-out to online recipients via SignalR
    │         └──▶ Push notification for offline recipients
    │
    └──▶ Update unread counters in Redis
```

**Cosmos DB Schema (Message):**
```json
{
  "id": "msg_uuid",
  "channelId": "ch_123",       // Partition key
  "threadId": "thread_456",    // null if top-level
  "senderId": "user_789",
  "tenantId": "org_abc",
  "content": "Hello team!",
  "contentType": "text/plain",
  "mentions": ["user_101"],
  "attachments": [],
  "reactions": { "👍": ["user_102"] },
  "createdAt": "2026-02-23T10:00:00Z",
  "editedAt": null,
  "deletedAt": null
}
```

**Why Cosmos DB?**
- Global distribution for multi-region Teams deployment.
- Partition by `channelId` — queries are almost always within a channel.
- Session consistency — user sees their own writes immediately.
- Change Feed drives the fan-out pipeline.

**3b. Presence Service**

- Each user's presence is stored in **Redis** with a TTL.
- Heartbeat every 30 seconds from connected clients.
- Presence changes are published via **pub/sub** to subscribers.
- Aggregation: user may be on multiple devices — pick the "most active" status.
- See [[02_building_blocks/caching]] for Redis patterns.

**3c. Video Calling Architecture**

```
Caller                    SFU (Selective Forwarding Unit)              Callee
  │                              │                                       │
  │── SRTP (video stream) ──────▶│                                       │
  │                              │──── SRTP (forwarded stream) ─────────▶│
  │                              │◀─── SRTP (callee's stream) ──────────│
  │◀── SRTP (forwarded) ────────│                                       │
```

- **Signaling:** WebSocket (via SignalR) for call setup, ICE candidates.
- **Media:** SFU model for group calls (each participant sends 1 stream, SFU
  selectively forwards to others). Much more efficient than mesh or MCU.
- **TURN servers** for NAT traversal when peer-to-peer fails.
- **Simulcast:** Sender transmits multiple quality layers; SFU picks the best
  for each receiver based on bandwidth.
- See [[05_case_studies/design_zoom]] for deeper video architecture.

**3d. File Sharing**

- Files uploaded to **Azure Blob Storage** (OneDrive backend).
- Message contains a reference (file ID + permissions).
- Co-editing uses **Operational Transform** (OT) via Office Online.
- See [[05_case_studies/design_google_docs]] for collaboration details.

### Step 4: Scaling & Reliability (5-10 min)

**Horizontal Scaling:**
- Chat Service: Stateless, scale behind [[02_building_blocks/load_balancers]].
- WebSocket Gateway: Sticky sessions by user ID, scale by adding nodes.
- Cosmos DB: Auto-scales RU/s, add regions for geo-distribution.
- SFU layer: Scale by allocating new SFU instances per call.

**Reliability:**
- Multi-region active-active deployment (US, EU, APAC minimum).
- Circuit breaker on all downstream calls — see [[03_design_patterns/circuit_breaker]].
- Message queue (Event Hubs) decouples write path from notification path.
- Retry with exponential backoff for transient failures.
- **Graceful degradation:** If video infra is overloaded, downgrade to audio-only.

**Monitoring:**
- Distributed tracing (Application Insights / OpenTelemetry).
- SLA dashboards: message delivery p99, call quality MOS scores.
- Alerting on error rate spikes, latency percentile breaches.

---

## 7. Red Flags & Green Flags

### 7.1 Red Flags (What Gets You Rejected)

| Red Flag                                    | Why It Hurts                                  |
|---------------------------------------------|-----------------------------------------------|
| Jumping to solution without requirements    | Shows poor engineering judgment                |
| Single-server design with no scaling story  | Microsoft operates at massive scale            |
| Ignoring data storage entirely              | Storage is where complexity lives              |
| No trade-off discussion                     | Microsoft values pragmatic decision-making     |
| "This is how Google does it"                | Shows you didn't tailor your answer            |
| Refusing to discuss alternatives            | Growth mindset = openness to other approaches  |
| No mention of failure scenarios             | Enterprise customers demand reliability        |
| Over-engineering for a simple problem       | Pragmatism > elegance at Microsoft             |
| Cannot estimate scale / do back-of-envelope | See [[07_interview_framework/estimation_cheat_sheet]] |
| Dismissing LLD as "beneath you"            | Microsoft still values OOP fundamentals        |

### 7.2 Green Flags (What Gets You Hired)

| Green Flag                                   | Why It Helps                                  |
|----------------------------------------------|-----------------------------------------------|
| Structured approach with clear phases        | Shows maturity and communication skills        |
| Asking about enterprise vs consumer context  | Shows Microsoft-specific awareness             |
| Discussing multi-tenancy and isolation       | Core to every Microsoft product                |
| Mentioning compliance / data residency       | Enterprise customers require it                |
| Offering 2-3 options with trade-offs         | Pragmatic engineering mindset                  |
| Proactively discussing failure modes         | Reliability-first thinking                     |
| Clean API design with versioning             | Backward compatibility awareness               |
| Considering backward compatibility           | Part of Microsoft's DNA                        |
| Natural mention of Azure services            | Cultural fit (but not required)                |
| Discussing monitoring and observability      | Production-readiness mindset                   |

---

## 8. Level-Specific Tips

### 8.1 SDE I / SDE II (L59-L61)

**What is expected:**
- Solid understanding of fundamentals: client-server, REST APIs, databases.
- Ability to break down a problem into components.
- Basic scaling awareness (caching, load balancing, database indexing).
- OOP design (LLD) may be the primary design question.

**What is NOT expected:**
- Distributed consensus, advanced consistency models.
- Multi-region architecture.
- Deep infrastructure knowledge.

**Tips:**
- Focus on a **clean, working design** rather than over-optimizing.
- Practice LLD problems (Parking Lot, Library System, Elevator).
- Know basic SQL vs NoSQL trade-offs.
- Show growth mindset — if you don't know something, say "I'd research X" rather
  than guessing.

### 8.2 Senior SDE (L62-L63)

**What is expected:**
- End-to-end system design with clear component breakdown.
- Detailed data model and storage decisions with justification.
- Scaling strategy: horizontal scaling, caching layers, async processing.
- Reliability: replication, failover, circuit breakers.
- API design with versioning and error handling.
- Trade-off analysis (at least 2-3 key decisions with pros/cons).

**What differentiates L62 from L63:**
- L63 candidates should demonstrate **cross-system thinking** — how does your
  design interact with adjacent systems?
- L63 should discuss **operational concerns**: deployment, monitoring, rollback.
- L63 should mention **security** without being prompted.

**Tips:**
- Always start with requirements. Never skip this.
- Prepare 2-3 deep-dive topics you can discuss fluently (e.g., caching strategies,
  message ordering, consistency models).
- Practice explaining trade-offs out loud — Microsoft values communication.
- Know [[08_reference/latency_numbers]] cold.

### 8.3 Principal SDE (L64-L65)

**What is expected:**
- Everything at L63, plus:
- **Org-wide architectural vision** — how does this system fit into the broader platform?
- **Build vs buy** analysis.
- **Cost analysis** — not just technical trade-offs, but cost implications.
- **Multi-region, multi-tenant** architecture as default thinking.
- **Security architecture** — authentication, authorization, encryption, key management.
- **Team structure implications** — "This design suggests 3 teams: platform, API, and client."

**What differentiates Principal:**
- Driving the conversation, not just responding.
- Identifying requirements the interviewer hasn't mentioned.
- Discussing **evolution** — "In v1, we'd do X. In v2, we'd migrate to Y because..."
- Connecting technical decisions to **business outcomes**.

**Tips:**
- Lead with **why** before **how**.
- Discuss SLAs quantitatively (e.g., "99.99% means 4.38 minutes downtime/month").
- Mention deployment strategy (blue-green, canary, ring-based — Microsoft uses ring
  deployments extensively).
- Talk about **technical debt management** and migration paths.
- Prepare to discuss how you've influenced architecture at previous companies.

---

## 9. Preparation Checklist

### 9.1 Four-Week Study Plan

**Week 1: Foundations**
- [ ] Review [[07_interview_framework/the_four_step_framework]]
- [ ] Memorize [[08_reference/latency_numbers]]
- [ ] Practice [[07_interview_framework/estimation_cheat_sheet]] (5 problems)
- [ ] Review [[02_building_blocks/caching]], [[02_building_blocks/cdn]], [[02_building_blocks/load_balancers]]
- [ ] Study Cosmos DB basics (consistency levels, partitioning)

**Week 2: Core Case Studies**
- [ ] Design Teams walkthrough (this guide + [[05_case_studies/design_zoom]])
- [ ] Design OneDrive ([[05_case_studies/design_google_docs]])
- [ ] Design Distributed Cache ([[05_case_studies/design_distributed_cache]])
- [ ] Design Notification Hub ([[05_case_studies/design_notification_system]])
- [ ] Practice 1 LLD problem (Parking Lot or Elevator)

**Week 3: Breadth Coverage**
- [ ] Design URL Shortener ([[05_case_studies/design_url_shortener]])
- [ ] Design Bing Autocomplete ([[05_case_studies/design_search_autocomplete]])
- [ ] Design a Logging/Monitoring System ([[05_case_studies/design_logging_system]])
- [ ] Design a Chat System ([[05_case_studies/design_chat_system]])
- [ ] Review [[03_design_patterns/circuit_breaker]] and resilience patterns
- [ ] Study [[15_intermediate_topics/cloud_architecture_patterns]]

**Week 4: Mock Interviews & Polish**
- [ ] 2-3 mock system design interviews (45 min each, timed)
- [ ] Review Azure services cheat sheet (Section 5.1 above)
- [ ] Practice enterprise-specific concerns (multi-tenancy, compliance)
- [ ] Review all red flags / green flags
- [ ] Prepare behavioral answers (growth mindset examples)
- [ ] Rest the day before your interview

### 9.2 Key Concepts to Know Cold

```
┌─────────────────────────────────────────────────────────────────┐
│                    MUST-KNOW CONCEPTS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STORAGE                                                        │
│  ├── SQL vs NoSQL trade-offs                                    │
│  ├── Cosmos DB partition keys and consistency levels             │
│  ├── Blob storage for files/media                               │
│  └── Redis for caching and pub/sub                              │
│                                                                 │
│  COMMUNICATION                                                  │
│  ├── REST vs gRPC vs WebSocket                                  │
│  ├── Message queues: at-least-once vs exactly-once              │
│  ├── Event-driven architecture (Event Hubs, Event Grid)         │
│  └── SignalR for real-time push                                 │
│                                                                 │
│  SCALING                                                        │
│  ├── Horizontal scaling, stateless services                     │
│  ├── Database sharding / partitioning                           │
│  ├── CDN for static assets                                      │
│  ├── Caching layers (L1 in-process, L2 distributed)             │
│  └── Async processing with queues                               │
│                                                                 │
│  RELIABILITY                                                    │
│  ├── Circuit breaker, bulkhead, retry patterns                  │
│  ├── Active-active multi-region                                 │
│  ├── Health checks and graceful degradation                     │
│  └── Ring-based deployments (canary on steroids)                │
│                                                                 │
│  ENTERPRISE                                                     │
│  ├── Multi-tenancy isolation models                             │
│  ├── RBAC (Role-Based Access Control)                           │
│  ├── Compliance: GDPR, HIPAA, SOC 2                            │
│  ├── Data residency and sovereignty                             │
│  └── API versioning and backward compatibility                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Day-of-Interview Tips

1. **Test your setup** — If virtual, ensure Teams (ironic, right?) works smoothly.
   Have a backup device ready.
2. **Bring a pen and paper** — Even for virtual interviews, sketching locally helps
   you think before drawing on the shared whiteboard.
3. **State assumptions explicitly** — "I'm assuming this is a consumer-facing app
   with global users. Should I consider enterprise features?"
4. **Watch for interviewer signals** — Microsoft interviewers are generally helpful.
   If they redirect you, follow their lead. It is not adversarial.
5. **Timebox yourself** — Don't spend 20 minutes on requirements. Move forward and
   revisit if needed.
6. **End strong** — Summarize your design in 60 seconds at the end. Mention what
   you'd improve with more time.

### 9.4 Behavioral Prep (Growth Mindset Questions)

Microsoft WILL ask behavioral questions. Common themes:

- "Tell me about a time you received critical feedback and changed your approach."
  *(Growth mindset)*
- "Describe a time you collaborated with a team that disagreed with your approach."
  *(One Microsoft)*
- "Tell me about a time you had to make a decision with incomplete information."
  *(Bias for action)*
- "How do you balance shipping fast vs shipping correctly?"
  *(Pragmatism)*

Structure answers using **STAR** (Situation, Task, Action, Result).

---

## 10. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│              MICROSOFT SYSTEM DESIGN — QUICK REFERENCE          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FORMAT:    45-60 min, 1 round (sometimes 2 for L63+)          │
│  STYLE:     Pragmatic, breadth > depth, enterprise-aware        │
│  LLD:       YES — still common, especially for L59-L62          │
│  AZURE:     Nice-to-have, not required                          │
│  AA ROUND:  Unique to Microsoft — final interview, has veto     │
│                                                                 │
│  TOP TIPS:                                                      │
│  1. Use the four-step framework                                 │
│  2. Always discuss trade-offs (2-3 key decisions minimum)       │
│  3. Mention multi-tenancy and enterprise concerns               │
│  4. Know Cosmos DB basics (partition keys, consistency)          │
│  5. Practice LLD if targeting L59-L62                           │
│  6. Show growth mindset in every interaction                    │
│  7. Prepare behavioral answers alongside technical prep         │
│                                                                 │
│  KEY VAULT LINKS:                                               │
│  • [[07_interview_framework/the_four_step_framework]]           │
│  • [[07_interview_framework/estimation_cheat_sheet]]            │
│  • [[08_reference/latency_numbers]]                             │
│  • [[05_case_studies/design_zoom]] (Teams comparison)           │
│  • [[05_case_studies/design_google_docs]] (OneDrive/SharePoint) │
│  • [[03_design_patterns/circuit_breaker]]                       │
│  • [[15_intermediate_topics/cloud_architecture_patterns]]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

> **Next steps:** Return to [[17_company_interview_guide/index]] for guides on other
> companies, or start practicing with [[05_case_studies/design_zoom]] (Design Teams)
> as your first mock walkthrough.
