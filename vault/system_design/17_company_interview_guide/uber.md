# Uber — System Design Interview Guide

> **Last Updated:** 2026-02-23
> **Difficulty:** Hard — domain-heavy, real-time systems, geo-spatial expertise expected
> **Back to:** [[17_company_interview_guide/index]]

---

## Table of Contents

1. [Company Overview & Engineering Culture](#company-overview--engineering-culture)
2. [Compensation & Levels](#compensation--levels)
3. [Interview Process](#interview-process)
4. [System Design Round Details](#system-design-round-details)
5. [Top 10 Most-Asked Questions](#top-10-most-asked-questions)
6. [Uber-Specific Technical Patterns](#uber-specific-technical-patterns)
7. [Sample Walkthrough — Design Ride Matching](#sample-walkthrough--design-ride-matching)
8. [Red Flags & Green Flags](#red-flags--green-flags)
9. [Preparation Checklist](#preparation-checklist)

---

## Company Overview & Engineering Culture

### Engineering Organization

Uber's engineering org is split across several key domains:

| Domain | Focus |
|--------|-------|
| **Rides (Mobility)** | Core ride-sharing platform, matching, pricing, routing |
| **Eats (Delivery)** | Food delivery, restaurant platform, courier logistics |
| **Freight** | Long-haul trucking marketplace |
| **Platform** | Shared infra — maps, payments, identity, data |
| **Autonomous (ATG successor)** | Self-driving research and integration |
| **Ads** | Uber's growing advertising platform |

### Tech Blog Focus Areas

Uber's engineering blog (eng.uber.com) is one of the most prolific in the industry.
Key recurring topics — these signal what interviewers care about:

- **Geo-spatial systems** — H3 hexagonal indexing, spatial queries at scale
- **Real-time streaming** — Apache Kafka (they run one of the largest deployments globally)
- **Microservice architecture** — DISCO service mesh, domain-oriented microservices
- **Data infrastructure** — Schemaless, Docstore, AresDB, Hudi
- **Machine learning** — Michelangelo ML platform, ETA prediction, fraud detection
- **Mobile** — RIBs architecture (Router-Interactor-Builder), Motif design system

### Engineering Culture Signals

- **Domain expertise matters** — Uber values candidates who understand the physical-world
  constraints of ride-sharing: geography, time, supply-demand economics
- **Data-driven** — Almost every design discussion involves metrics, A/B testing, ML
- **Reliability obsessed** — Serving millions of real-time rides; downtime = stranded riders
- **Microservices at extreme scale** — 4,000+ microservices, heavy inter-service communication
- **Open-source contributors** — Jaeger (tracing), H3 (geo indexing), Cadence (workflows),
  Peloton (resource scheduler), Piranha (dead code cleanup)

---

## Compensation & Levels

### Uber Engineering Levels

| Level | Title | Scope |
|-------|-------|-------|
| **IC1** | Software Engineer I | New grad, task-level ownership |
| **IC2** | Software Engineer II | Feature-level ownership, 1-3 YOE |
| **IC3** | Senior Software Engineer | Project-level ownership, 3-7 YOE |
| **IC4** | Staff Software Engineer | Multi-project/team influence, 7-12 YOE |
| **IC5a** | Senior Staff Software Engineer | Org-wide technical direction |
| **IC5b** | Principal Engineer | Company-wide technical strategy |
| **IC6** | Distinguished Engineer | Industry-level impact (very rare) |

> **Note:** IC3 (Senior) is the most common system design interview level.
> IC4+ (Staff) interviews go significantly deeper into architecture trade-offs.

### Compensation — United States (2025-2026)

| Level | Base Salary (USD) | RSUs (Annual Vest) | Total Comp (Year 1) |
|-------|-------------------|---------------------|----------------------|
| **IC1** | $130K - $155K | $15K - $30K | $155K - $200K |
| **IC2** | $155K - $190K | $30K - $60K | $200K - $270K |
| **IC3** | $190K - $230K | $60K - $120K | $280K - $380K |
| **IC4** | $230K - $275K | $120K - $220K | $380K - $530K |
| **IC5a** | $270K - $320K | $200K - $400K | $500K - $750K |
| **IC5b** | $300K - $350K | $350K - $600K | $700K - $1M+ |

- RSUs vest over 4 years, typically with equal quarterly vesting
- Annual bonus target: 15% for IC3, 20% for IC4, 25% for IC5
- Signing bonus common: $20K-$80K depending on level and competing offers

### Compensation — India (Bangalore/Hyderabad)

| Level | Base (INR LPA) | RSUs (Annual) | Total Comp (INR LPA) |
|-------|-----------------|---------------|----------------------|
| **IC1** | 18L - 25L | 3L - 6L | 22L - 35L |
| **IC2** | 28L - 40L | 8L - 18L | 40L - 65L |
| **IC3** | 42L - 58L | 18L - 40L | 65L - 105L |
| **IC4** | 55L - 75L | 35L - 70L | 95L - 155L |
| **IC5a** | 70L - 90L | 60L - 110L | 140L - 210L |

> India RSU values fluctuate with Uber's stock price (UBER on NYSE).
> These are approximate ranges — actual offers depend on team, prior comp, and negotiation.

---

## Interview Process

### Pipeline Overview

```
Application / Referral
       │
       ▼
Recruiter Screen (30 min)
       │
       ▼
Technical Phone Screen (60 min)  ← Coding (DSA)
       │
       ▼
Onsite / Virtual Onsite (4-5 rounds, full day)
       │
       ▼
Hiring Committee Review
       │
       ▼
Offer / Team Match
```

### Round-by-Round Breakdown

#### 1. Recruiter Screen (30 min)

- Role expectations, level calibration
- Motivation for Uber specifically (they care about this)
- High-level experience walkthrough
- Compensation expectations discussion

#### 2. Technical Phone Screen (60 min)

- **Format:** Live coding on CoderPad
- **Focus:** DSA — arrays, strings, graphs, trees, dynamic programming
- **Difficulty:** LeetCode Medium to Hard
- **Common themes:** Graph problems (maps/routing are graph problems),
  geospatial (coordinate-based problems), interval scheduling
- Must complete 1-2 problems with working code and discuss time/space complexity

#### 3. Onsite — Coding Round 1 (60 min)

- Harder DSA than phone screen
- Often graph-based or geometry-based problems (reflecting Uber's domain)
- May include follow-ups that add real-world constraints (scale, edge cases)

#### 4. Onsite — Coding Round 2 (60 min)

- Sometimes replaced with a "practical coding" or "domain coding" round
- Could involve designing an API, implementing a small service, or OOP design
- For IC4+, this may be a "code quality and architecture" round

#### 5. Onsite — System Design (60 min)

- **The make-or-break round** — detailed breakdown in next section
- Uber's system design interviews are among the most domain-specific in FAANG
- Expect questions tied to ride-sharing, delivery, maps, real-time systems

#### 6. Onsite — Behavioral / Leadership (45-60 min)

- Uber uses a structured behavioral format
- Core values assessed: ownership, customer obsession, data-driven decisions
- For IC4+, strong emphasis on cross-team influence, mentoring, technical strategy
- Expect STAR-format questions on conflict resolution, ambiguity, failure handling

### Uber-Specific Interview Quirks

- **Domain alignment matters:** Uber interviewers often expect candidates to
  understand ride-sharing concepts at a deeper level than generic FAANG interviews
- **Real-time systems bias:** Nearly all design questions involve some real-time component
- **Geo-spatial literacy:** You should know what geohashing is, at minimum, before walking in
- **Follow-up depth:** Interviewers push hard on scaling, failure modes, and data consistency
- **Practical > theoretical:** They prefer candidates who think about deployment, monitoring,
  and operability, not just whiteboard architecture

---

## System Design Round Details

### Format

| Aspect | Detail |
|--------|--------|
| **Duration** | 45-60 minutes |
| **Tools** | Whiteboard (onsite) or virtual whiteboard (Excalidraw, Miro) |
| **Level expectations** | IC2: basic; IC3: strong; IC4+: expert with deep dives |
| **Interviewer** | Usually a senior/staff engineer from a related team |

### What Uber Interviewers Look For

Use the [[07_interview_framework/the_four_step_framework]] as your base, but calibrate for Uber:

#### 1. Requirements Gathering (5-8 min)
- Do you ask about scale? (Cities, rides/day, peak vs off-peak)
- Do you separate rider experience from driver experience?
- Do you consider geographic constraints? (Dense city vs suburban vs rural)
- Do you think about real-time latency requirements?

#### 2. High-Level Design (10-15 min)
- Clean component diagram with clear data flow
- Separation of real-time path (matching, tracking) from async path (payments, history)
- Event-driven architecture awareness
- API design for both rider and driver apps

#### 3. Deep Dive (20-25 min) — **This is where Uber interviews diverge**
- **Geo-spatial indexing** — How do you find nearby drivers? What data structure?
- **Real-time communication** — WebSockets, SSE, long polling trade-offs
- **Matching algorithm** — How do you pair riders with drivers optimally?
- **Consistency vs availability** — What happens when a match fails? Double-booking?
- **Failure handling** — Driver goes offline mid-match? Payment service down?

#### 4. Scaling & Extensions (5-10 min)
- Multi-city, multi-region deployment
- Peak load handling (surge, events, weather)
- Data partitioning strategy ([[03_design_patterns/sharding]])
- Monitoring, alerting, SLAs

### Scoring Rubric (Approximate)

| Signal | Weight |
|--------|--------|
| Problem decomposition & requirements | 20% |
| System architecture & component design | 25% |
| Deep dive into 1-2 critical components | 30% |
| Scalability, reliability, trade-offs | 15% |
| Communication & collaboration | 10% |

> The deep dive carries the most weight. Uber wants to see you can go **deep**,
> not just draw boxes and arrows.

---

## Top 10 Most-Asked Questions

### 1. Design Uber's Ride Matching System

> **Frequency:** Very High — the single most asked question
> **Vault Link:** [[05_case_studies/design_ride_sharing]]

**Key areas to cover:**
- Rider request flow: location → nearby driver search → match → confirm
- Geo-spatial indexing for finding nearby drivers (H3, S2, Geohash)
- Matching algorithm: nearest-first vs optimal assignment (Hungarian algorithm)
- Real-time driver location updates via WebSocket
- Handling match failures, timeouts, driver cancellations
- Supply-demand dynamics affecting match radius

**Uber-specific depth:**
- Uber uses H3 (hexagonal hierarchical spatial index) for geo queries
- Matching is a constrained optimization problem, not just "find nearest"
- Consider ETA-based matching (closest by time, not distance)
- Dispatch system must handle thousands of concurrent match requests

---

### 2. Design Uber's ETA Prediction System

> **Frequency:** High
> **Vault Link:** [[05_case_studies/design_google_maps]]

**Key areas to cover:**
- Road network as a weighted directed graph
- Routing algorithms: Dijkstra, A*, Contraction Hierarchies
- Real-time traffic data ingestion from driver GPS pings
- Historical traffic patterns (time-of-day, day-of-week)
- ML model for ETA prediction (features: distance, traffic, weather, events)
- Segment-level vs route-level ETA computation

**Uber-specific depth:**
- Uber's ETA system processes millions of GPS pings per second
- They partition the road network by city/region
- Pre-computed routing tables with real-time overlays
- ETA accuracy directly impacts rider trust and surge pricing calculations
- Refer to [[08_reference/latency_numbers]] for latency constraints

---

### 3. Design Surge Pricing Engine

> **Frequency:** High
> **Vault Link:** None (standalone topic)

**Key areas to cover:**
- Supply-demand calculation per geographic zone
- Real-time demand signals: ride requests per zone per time window
- Real-time supply signals: available drivers per zone
- Surge multiplier calculation algorithm
- Price elasticity modeling (higher surge = fewer requests = rebalance)
- Zone definition and granularity (H3 hexagons at resolution 7-9)

**Architecture outline:**
```
GPS Pings (drivers) ──→ Location Aggregator ──→ Supply Counter (per zone)
                                                        │
Ride Requests ─────────→ Request Aggregator ──→ Demand Counter (per zone)
                                                        │
                                              ┌─────────▼──────────┐
                                              │  Surge Calculator   │
                                              │  (supply/demand     │
                                              │   ratio per zone)   │
                                              └─────────┬──────────┘
                                                        │
                                                        ▼
                                              Surge Multiplier Cache
                                              (read by Pricing Service)
```

**Key design decisions:**
- Sliding window (e.g., 5 min) vs tumbling window for demand counting
- Smoothing algorithm to prevent surge oscillation (surge → demand drops → surge drops → demand spikes → repeat)
- Geographic smoothing: adjacent zones should not have wildly different surge
- Regulatory constraints: some cities cap surge multipliers
- Caching: surge values change every few minutes, not every second

---

### 4. Design Real-Time Driver Location Tracking

> **Frequency:** High
> **Vault Link:** Related to [[05_case_studies/design_ride_sharing]]

**Key areas to cover:**
- Driver app sends GPS coordinates every 3-5 seconds
- Protocol choice: WebSocket for bidirectional, or HTTP/2 push
- Scale: millions of active drivers, each sending updates every few seconds
- Location ingestion pipeline: Gateway → Kafka → Location Service → Storage
- Storage: time-series DB or in-memory store (Redis) for latest location
- Consumers: matching service, ETA service, rider app (live tracking)

**Architecture:**
```
Driver App
    │ (WebSocket / gRPC stream)
    ▼
Connection Gateway (stateful, sticky sessions)
    │
    ▼
Kafka Topic: driver-locations
    │
    ├──→ Location Service (update in-memory grid)
    ├──→ Trip Tracker (update active trip positions)
    ├──→ Analytics Pipeline (store in data warehouse)
    └──→ Supply Service (update driver availability map)
```

**Scale math (use [[07_interview_framework/estimation_cheat_sheet]]):**
- 5 million active drivers globally
- 1 update every 4 seconds = 1.25M messages/second
- Each message ~200 bytes (lat, lng, timestamp, driver_id, heading, speed)
- Throughput: ~250 MB/s raw ingestion
- This is a perfect Kafka use case — Uber runs one of the world's largest Kafka clusters

---

### 5. Design Uber Eats Delivery System

> **Frequency:** High
> **Vault Link:** [[10_hld/examples/hld_food_delivery]]

**Key areas to cover:**
- Three-sided marketplace: customer, restaurant, courier
- Order lifecycle: browse → order → restaurant confirms → prep → courier assigned → pickup → delivery
- Restaurant availability and menu management
- Courier matching (different from ride matching — must consider food prep time)
- Batching: one courier picks up from multiple restaurants or delivers to nearby addresses
- ETA for food: prep time + pickup ETA + delivery ETA

**Uber-specific depth:**
- Uber Eats reuses much of the Rides infrastructure (matching, routing, tracking)
- Key difference: food prep time is highly variable and hard to predict
- Restaurant ranking involves ML: relevance, delivery time, ratings, promotions
- Courier assignment must be timed — too early and courier waits, too late and food sits

---

### 6. Design Notification System for Uber

> **Frequency:** Medium-High
> **Vault Link:** [[05_case_studies/design_notification_system]]

**Key areas to cover:**
- Push notifications (APNS, FCM), SMS, email, in-app
- Critical path notifications: "Driver arriving", "Trip started", "Payment processed"
- Non-critical: promotions, receipts, weekly summaries
- Priority queuing: ride-related notifications must be near-instant (<1s)
- Deduplication and rate limiting
- Multi-channel fallback: push fails → SMS → email

**Uber-specific considerations:**
- Ride notifications are time-critical — 500ms SLA for "driver arriving"
- Must work in areas with poor connectivity (fallback to SMS)
- Internationalization: 70+ countries, dozens of languages
- Notification preferences per user, per channel
- Use [[02_building_blocks/message_queues]] for async processing
- Apply [[05_case_studies/design_rate_limiter]] patterns for throttling

---

### 7. Design Payment Splitting System

> **Frequency:** Medium
> **Vault Link:** None (standalone topic)

**Key areas to cover:**
- Fare calculation: base fare + distance + time + surge + tolls + fees
- Split types: equal split, custom amounts, split with non-app users
- Payment methods: credit card, debit, UPI (India), wallet, cash
- Multi-currency support across 70+ countries
- Idempotency for payment processing (critical — never double-charge)
- Ledger design: double-entry bookkeeping for every transaction

**Architecture considerations:**
- Payment processing must be strongly consistent (not eventually consistent)
- Saga pattern for multi-step payment flows (authorize → capture → settle)
- Reconciliation pipeline for matching internal records with payment processor records
- PCI-DSS compliance: never store raw card numbers in application databases
- Retry with exponential backoff for payment gateway timeouts
- Use [[02_building_blocks/databases_nosql]] for trip/payment event logs

---

### 8. Design Trip History & Analytics

> **Frequency:** Medium
> **Vault Link:** None (standalone topic)

**Key areas to cover:**
- Trip data model: rider, driver, route, fare, timestamps, ratings
- Read-heavy system: riders view history far more often than trips are created
- Search and filter: by date range, city, fare amount
- Analytics: spending trends, frequent routes, carbon footprint
- Data pipeline for business analytics (Uber's management dashboards)

**Architecture:**
- OLTP store for recent trips (PostgreSQL, sharded by rider_id)
- OLAP store for analytics (data warehouse — Uber uses Hive/Spark/Presto)
- Archival strategy: trips older than N months moved to cold storage
- Caching layer for frequently accessed recent trips
- Event sourcing: trip events (requested, matched, started, completed) as immutable log
- Sharding strategy: by user_id for rider queries, by city for business analytics
  ([[03_design_patterns/sharding]])

---

### 9. Design Geofencing System

> **Frequency:** Medium
> **Vault Link:** None (standalone topic)

**Key areas to cover:**
- Define geographic zones: airports, city boundaries, restricted areas, surge zones
- Point-in-polygon queries: given a lat/lng, which zones does it belong to?
- Use cases: airport pickup rules, city-specific pricing, regulatory compliance
- Dynamic geofences: surge zones change every few minutes
- Static geofences: airport boundaries, country borders — change rarely

**Data structures:**
- R-tree for spatial indexing of polygon boundaries
- H3 hexagonal index for approximate zone membership (fast)
- Pre-computed lookup table: H3 cell → list of containing geofences
- For dynamic geofences: rebuild index periodically (every 1-5 minutes)

**Scale:**
- Millions of point-in-polygon queries per second (every ride request, every GPS ping)
- Hundreds of thousands of geofences globally
- Must answer queries in <10ms (it's in the critical path of ride requests)

---

### 10. Design Rate Limiter for Uber's API Gateway

> **Frequency:** Medium
> **Vault Link:** [[05_case_studies/design_rate_limiter]]

**Key areas to cover:**
- Multi-tier rate limiting: per-user, per-API-key, per-service, global
- Algorithms: token bucket, sliding window log, sliding window counter
- Distributed rate limiting across multiple API gateway instances
- Different limits for different endpoints (ride request vs trip history)
- Graceful degradation: rate-limited requests get 429, not dropped silently

**Uber-specific angle:**
- API gateway handles millions of requests/second
- Must not add significant latency (<1ms overhead)
- Redis-based distributed counters with [[03_design_patterns/consistent_hashing]]
- Special handling for driver location updates (high frequency, must not rate-limit aggressively)
- Bot detection and abuse prevention layer on top of basic rate limiting

---

## Uber-Specific Technical Patterns

Understanding Uber's actual technology stack gives you a massive advantage.
These are real systems and patterns Uber has written about publicly.

### 1. H3 — Hexagonal Hierarchical Spatial Index

Uber's open-source geo-spatial indexing system. **Know this well.**

```
Key concepts:
- Earth's surface divided into hexagonal cells at multiple resolutions (0-15)
- Resolution 7 ≈ 5.16 km² per cell (city-level zones)
- Resolution 9 ≈ 0.105 km² per cell (neighborhood-level)
- Resolution 11 ≈ 0.002 km² per cell (block-level)

Why hexagons?
- Unlike squares, hexagons have uniform adjacency (6 neighbors, all equidistant)
- No ambiguity about "diagonal" neighbors
- Better approximation of circles (search radius)
- Hierarchical: each hex contains ~7 children at next resolution

Operations:
- latLngToCell(lat, lng, resolution) → H3 index
- cellToLatLng(h3Index) → center point
- gridDisk(h3Index, k) → all cells within k rings
- cellToChildren(h3Index, childRes) → finer-grained cells
```

**How Uber uses H3:**
- Surge pricing: compute supply/demand per H3 cell at resolution 7-8
- Driver search: find available drivers in gridDisk(riderCell, k) rings
- Analytics: aggregate trip data by geographic cell
- Marketplace optimization: balance supply across cells

### 2. Geohash and S2 (Alternatives to H3)

| System | Shape | Hierarchy | Adjacency | Used By |
|--------|-------|-----------|-----------|---------|
| **Geohash** | Rectangles | Yes (prefix-based) | 8 neighbors, non-uniform | Many companies |
| **S2** | Quadrilaterals | Yes (Hilbert curve) | Variable | Google, Foursquare |
| **H3** | Hexagons | Yes (aperture 7) | 6 neighbors, uniform | Uber |

For an Uber interview, knowing H3 deeply is ideal. At minimum, understand
geohashing and why spatial indexing is necessary.

### 3. Real-Time Pub/Sub at Scale

Uber processes millions of real-time events per second using a layered pub/sub architecture.

```
Layer 1: Apache Kafka
├── Driver location updates (highest throughput topic)
├── Trip state changes
├── Payment events
└── Analytics events

Layer 2: In-memory pub/sub (for live tracking)
├── Rider subscribes to their driver's location
├── Sub-second latency requirement
├── Connection gateway manages WebSocket connections
└── Routing: trip_id → specific gateway instance

Layer 3: Push notification pipeline
├── For offline or background users
├── APNS / FCM integration
└── SMS fallback
```

Related: [[03_design_patterns/pub_sub]], [[02_building_blocks/message_queues]]

### 4. DISCO — Uber's Service Mesh

Uber built DISCO (Discovery and Load Balancing) for service-to-service communication:

- **Service discovery:** Services register themselves; callers look up healthy instances
- **Client-side load balancing:** Caller picks which instance to call
- **Circuit breaking:** Stop calling a service that's failing
- **Retry budgets:** Limit total retries to prevent cascade failures
- **Zone-aware routing:** Prefer calling services in the same datacenter/zone

> In interviews, mentioning service mesh concepts shows operational maturity.

### 5. Ringpop — Consistent Hashing Library

Uber's open-source consistent hashing ring for distributed systems:

```
Use case: Distributing driver state across a cluster of matching servers

- Each server owns a range of the hash ring
- Driver assigned to server based on hash(driver_id)
- When servers join/leave, minimal reshuffling (consistent hashing property)
- Gossip protocol for membership detection
```

Related: [[03_design_patterns/consistent_hashing]]

### 6. Schemaless — Uber's Custom Database

Before migrating to other solutions, Uber built Schemaless:

- Append-only, immutable storage (event sourcing style)
- Built on top of MySQL (uses MySQL as a storage engine)
- Cells identified by (row_key, column_key, ref_key)
- Optimized for write-heavy workloads (trip events, location updates)
- Eventually consistent with tunable consistency
- Sharded by row_key using consistent hashing

> This shows Uber's pattern of building custom infrastructure when off-the-shelf
> solutions don't meet their specific scale/latency requirements.

### 7. Apache Kafka at Uber Scale

Uber operates one of the largest Kafka deployments in the world:

- **Trillions of messages per day** across all topics
- **Thousands of topics** spanning rides, eats, freight, payments, analytics
- Multi-cluster, cross-datacenter replication
- Custom consumer framework for exactly-once processing semantics
- Tiered storage: hot data in Kafka, older data in HDFS/S3

Key Kafka patterns at Uber:
- Dead letter queues for failed message processing
- Schema registry for message format evolution (Avro)
- Consumer lag monitoring as a critical operational metric
- Topic partitioning aligned with geographic regions

### 8. Supply-Demand Modeling

The economic engine behind Uber's marketplace:

```
For each geographic zone and time window:

  supply_score = f(available_drivers, avg_idle_time, incoming_drivers)
  demand_score = g(ride_requests, predicted_future_requests, cancellation_rate)

  imbalance_ratio = demand_score / supply_score

  if imbalance_ratio > threshold:
      surge_multiplier = h(imbalance_ratio)  # non-linear, capped
      # Also trigger: incentivize drivers to move to high-demand zones

  Predictions use:
  - Historical patterns (time-of-day, day-of-week, holidays)
  - Real-time signals (events, weather, transit disruptions)
  - ML models trained on years of trip data
```

---

## Sample Walkthrough — Design Ride Matching

> Full walkthrough of Uber's most-asked question.
> Use this as your template. See also [[05_case_studies/design_ride_sharing]].
> Follow [[07_interview_framework/the_four_step_framework]].

### Step 1: Requirements & Scope (5-7 min)

**Functional Requirements:**
- Rider requests a ride from point A to point B
- System finds the best available driver nearby
- Driver accepts/declines the match
- Both rider and driver see each other's location in real-time
- Trip completes, fare is calculated and charged

**Non-Functional Requirements:**
- Match latency: rider should see a driver within 10-15 seconds
- Location freshness: driver position updated every 3-5 seconds
- Availability: 99.99% uptime (ride matching is life-critical for revenue)
- Global scale: 100+ cities, 5M+ drivers, 20M+ rides/day

**Scale Estimation (refer to [[07_interview_framework/estimation_cheat_sheet]]):**
- 20M rides/day = ~230 rides/second average, ~1,000/second peak
- 5M active drivers, each sending location every 4s = 1.25M location updates/second
- Match requests: ~500/second average, ~2,000/second peak
- Each match computation must complete in <5 seconds

### Step 2: High-Level Design (10 min)

```
┌──────────────┐                              ┌──────────────┐
│  Rider App   │──── REST/gRPC ────────────── │  API Gateway  │
└──────────────┘                              └───────┬───────┘
                                                      │
┌──────────────┐                              ┌───────▼───────┐
│  Driver App  │──── WebSocket ───────────────│  Connection   │
└──────────────┘                              │  Gateway      │
                                              └───────┬───────┘
                                                      │
                    ┌─────────────────────────────────┼──────────────────┐
                    │                                 │                  │
           ┌────────▼────────┐             ┌─────────▼──────┐  ┌───────▼────────┐
           │  Ride Request   │             │   Location     │  │  Trip          │
           │  Service        │             │   Service      │  │  Service       │
           └────────┬────────┘             └─────────┬──────┘  └───────┬────────┘
                    │                                │                  │
           ┌────────▼────────┐             ┌─────────▼──────┐          │
           │  Matching       │◄────────────│  Supply        │          │
           │  Service        │             │  Service       │          │
           └────────┬────────┘             └────────────────┘          │
                    │                                                   │
           ┌────────▼────────┐                                ┌───────▼────────┐
           │  Pricing        │                                │  Payment       │
           │  Service        │                                │  Service       │
           └─────────────────┘                                └────────────────┘
```

**Core Services:**

| Service | Responsibility |
|---------|---------------|
| **API Gateway** | Authentication, rate limiting, routing |
| **Connection Gateway** | Manages WebSocket connections to driver/rider apps |
| **Ride Request Service** | Validates and processes ride requests |
| **Location Service** | Ingests and stores driver GPS updates |
| **Supply Service** | Tracks available drivers, maintains geo-spatial index |
| **Matching Service** | Pairs riders with optimal drivers |
| **Trip Service** | Manages trip lifecycle (created → matched → in_progress → completed) |
| **Pricing Service** | Fare calculation, surge pricing |
| **Payment Service** | Charge processing, receipts |

### Step 3: Deep Dive — Geo-Spatial Matching (20 min)

This is the heart of the interview. Go deep here.

#### 3a. Driver Location Ingestion

```
Driver App sends every 4 seconds:
{
  "driver_id": "d_12345",
  "lat": 37.7749,
  "lng": -122.4194,
  "timestamp": 1708700000,
  "heading": 270,
  "speed": 15.5,  // m/s
  "status": "available"  // available | on_trip | offline
}

Flow:
Driver App → WebSocket → Connection Gateway → Kafka (driver-locations topic)
                                                   │
                                    ┌──────────────┼───────────────┐
                                    ▼              ▼               ▼
                              Location DB    Supply Service    Analytics
                              (latest pos)   (geo-index)      (warehouse)
```

#### 3b. Geo-Spatial Index for Nearby Driver Search

**Using H3 hexagonal index:**

```
When Location Service receives a driver update:
1. Compute H3 cell: h3_cell = h3.latLngToCell(lat, lng, resolution=9)
2. Update in-memory index: geo_index[h3_cell].add(driver_id)
3. Remove from previous cell if driver moved: geo_index[old_cell].remove(driver_id)

When Matching Service needs nearby drivers:
1. Compute rider's H3 cell: rider_cell = h3.latLngToCell(rider_lat, rider_lng, 9)
2. Get nearby cells: nearby = h3.gridDisk(rider_cell, k=2)  // k rings out
3. Collect candidates: for each cell in nearby: candidates += geo_index[cell]
4. Filter: only "available" status drivers
5. Rank by ETA (not just distance — a driver 1km away on a highway is faster
   than a driver 0.5km away in congested streets)
```

**Why H3 at resolution 9?**
- Each cell ≈ 0.105 km² → roughly a city block
- gridDisk with k=2 covers ~19 cells ≈ 2 km² — good initial search radius
- If not enough drivers found, expand to k=3, k=4, etc.
- Resolution is tunable per city (denser cities use higher resolution)

#### 3c. Matching Algorithm

```
Simple approach (good for interview):
1. Get candidate drivers from geo-spatial query (typically 10-50 candidates)
2. For each candidate, compute ETA using routing service
3. Sort by ETA ascending
4. Offer ride to best driver → wait for accept (timeout: 15 seconds)
5. If declined/timeout → offer to next driver
6. If all candidates exhausted → expand search radius and retry

Optimized approach (mention for bonus points):
1. Batch matching: accumulate ride requests for a short window (1-2 seconds)
2. Solve assignment problem: minimize total ETA across all rider-driver pairs
3. This is a bipartite matching / assignment problem
4. Solved via Hungarian algorithm or auction-based optimization
5. Much better overall efficiency than greedy nearest-first

Uber's actual approach:
- Batched matching in 2-second windows
- Considers: ETA, driver rating, vehicle type, direction of travel
- Weighted scoring: score = w1*ETA + w2*rating + w3*direction_alignment
- ML model predicts acceptance probability per driver
```

#### 3d. State Machine for Trip Lifecycle

```
┌──────────┐     match      ┌──────────┐    driver     ┌──────────┐
│REQUESTING │──────────────→│ MATCHING  │───arrives───→│ ARRIVED  │
└──────────┘               └──────────┘               └──────────┘
                                │                           │
                           timeout/                    rider boards
                           all decline                      │
                                │                     ┌─────▼──────┐
                                ▼                     │ IN_PROGRESS │
                          ┌──────────┐                └─────┬──────┘
                          │ NO_MATCH │                      │
                          └──────────┘               trip completes
                                                           │
                                                     ┌─────▼──────┐
                                                     │ COMPLETED  │
                                                     └─────┬──────┘
                                                           │
                                                     ┌─────▼──────┐
                                                     │   BILLED   │
                                                     └────────────┘
```

#### 3e. Real-Time Tracking (Rider watching driver approach)

```
1. Rider subscribes to trip updates via WebSocket
2. Connection Gateway maps: trip_id → rider's WebSocket connection
3. Driver location updates flow through Kafka
4. Trip Tracker service filters: only forward updates for active trips
5. Trip Tracker publishes to Connection Gateway: "driver at (lat, lng)"
6. Connection Gateway pushes to rider's WebSocket

Latency budget:
- Driver GPS → Connection Gateway: ~50ms
- Gateway → Kafka: ~10ms
- Kafka → Trip Tracker: ~50ms
- Trip Tracker → Connection Gateway: ~20ms
- Gateway → Rider app: ~50ms
- Total: ~180ms end-to-end (well within 1s requirement)

Refer to [[08_reference/latency_numbers]] for network latency baselines.
```

### Step 4: Scaling & Reliability (5-10 min)

#### Data Partitioning
- **Location Service:** Partition by city/region (geographic sharding)
- **Trip Service:** Partition by trip_id (hash-based) for writes,
  secondary index on rider_id/driver_id for reads
- **Supply Service (geo-index):** Partition by geographic region,
  each region served by a cluster of nodes using [[03_design_patterns/consistent_hashing]]

#### Failure Handling
| Failure | Mitigation |
|---------|------------|
| Matching service down | Retry with exponential backoff; queue ride requests in Kafka |
| Driver goes offline mid-match | Timeout (15s) → automatic re-match with next driver |
| Payment service down | Complete trip, bill asynchronously (eventual consistency on payment) |
| Kafka lag spike | Alert; scale consumers horizontally; degrade analytics before matching |
| Location service stale | Use last known location with staleness indicator; expand search radius |

#### Multi-Region Deployment
- Each city/region operates semi-independently
- Cross-region data replication for user profiles, payment info
- Ride matching is strictly local (a driver in NYC won't match a rider in SF)
- This natural geographic partitioning makes scaling easier than many other systems

#### Monitoring
- Match success rate per city (target: >95%)
- Match latency p50, p95, p99 (target: p99 < 15s)
- Location update lag (target: p99 < 500ms)
- Driver utilization rate (time on trip / time online)

---

## Red Flags & Green Flags

### Red Flags (Things That Will Hurt Your Score)

| Red Flag | Why It Matters |
|----------|----------------|
| Using simple lat/lng distance without spatial indexing | Shows no understanding of geo-spatial systems |
| Ignoring real-time requirements | Uber is a real-time company; batch-thinking won't work |
| Single database for everything | At Uber's scale, this is a non-starter |
| Not discussing failure modes | Uber's reliability requirements are extreme |
| Treating matching as "find nearest driver" | It's an optimization problem, not a nearest-neighbor lookup |
| No mention of consistency for payments/matching | Double-booking a driver or double-charging is catastrophic |
| Drawing boxes without explaining data flow | Uber interviewers want to see you think about data movement |
| Ignoring the driver's perspective | Two-sided marketplace; forgetting drivers is a major miss |
| Not asking clarifying questions | Jumping to solution without scoping shows poor engineering judgment |
| Over-engineering from the start | Start simple, then optimize — Uber values pragmatism |

### Green Flags (Things That Will Impress)

| Green Flag | Why It Impresses |
|------------|------------------|
| Mentioning H3 or any spatial indexing by name | Shows you've done homework on Uber's actual stack |
| Discussing ETA-based matching vs distance-based | Shows deeper understanding of the problem |
| Considering supply-demand dynamics | Shows business awareness and marketplace thinking |
| Bringing up event-driven architecture with Kafka | Aligns with how Uber actually works |
| Discussing graceful degradation | "If X fails, we can still do Y" — shows operational thinking |
| Calculating back-of-envelope numbers confidently | Use [[07_interview_framework/estimation_cheat_sheet]] |
| Mentioning batched matching / assignment optimization | Shows algorithmic depth |
| Discussing WebSocket vs polling trade-offs | Shows real-time systems expertise |
| Thinking about multi-city/region from the start | Natural partitioning is a key Uber insight |
| Separating hot path (matching) from cold path (analytics) | Shows system architecture maturity |

---

## Preparation Checklist

### Week 1-2: Foundations

- [ ] Study [[07_interview_framework/the_four_step_framework]] until it's second nature
- [ ] Review [[08_reference/latency_numbers]] — memorize key numbers
- [ ] Study [[02_building_blocks/message_queues]] — Kafka is central to Uber
- [ ] Study [[02_building_blocks/databases_nosql]] — understand when to use what
- [ ] Study [[03_design_patterns/consistent_hashing]] — used everywhere at Uber
- [ ] Study [[03_design_patterns/sharding]] — geographic sharding is Uber's primary pattern
- [ ] Study [[03_design_patterns/pub_sub]] — real-time event distribution
- [ ] Read 5-10 Uber engineering blog posts (eng.uber.com), focus on:
  - "H3: Uber's Hexagonal Hierarchical Spatial Index"
  - "Uber's Real-Time Push Platform"
  - "Designing Uber's Marketplace"
  - "Schemaless: Uber Engineering's Trip Data Store"
  - "DISCO: Uber's Service Discovery"

### Week 3: Core Practice

- [ ] Practice [[05_case_studies/design_ride_sharing]] end-to-end (timed, 45 min)
- [ ] Practice [[05_case_studies/design_google_maps]] — maps/routing is Uber-adjacent
- [ ] Practice [[05_case_studies/design_notification_system]] — real-time notifications
- [ ] Practice [[05_case_studies/design_rate_limiter]] — API gateway pattern
- [ ] Practice surge pricing design (use outline from this guide)
- [ ] Practice real-time tracking design (use outline from this guide)

### Week 4: Deep Dives & Mock Interviews

- [ ] Practice [[05_case_studies/design_chat_system]] — WebSocket patterns transfer directly
- [ ] Practice [[10_hld/examples/hld_food_delivery]] — Uber Eats is a common variant
- [ ] Do at least 2 mock interviews focused on geo-spatial systems
- [ ] Practice explaining H3 / geohashing to a non-expert in 2 minutes
- [ ] Practice back-of-envelope calculations for Uber-scale numbers
- [ ] Prepare 3-4 STAR stories for behavioral round (focus on: ownership,
  handling ambiguity, cross-team collaboration, data-driven decisions)

### Day Before

- [ ] Review this guide's Top 10 questions — have a 2-minute pitch for each
- [ ] Review H3 basics: resolution levels, gridDisk, lat/lng to cell
- [ ] Review Kafka basics: topics, partitions, consumer groups, ordering
- [ ] Review consistent hashing and why it matters for Uber
- [ ] Get good sleep — Uber's onsite is a long day

### Key Numbers to Memorize

```
Uber scale (approximate, for estimation):
- 20M+ rides per day globally
- 5M+ active drivers
- 130M+ monthly active users
- Present in 70+ countries, 10,000+ cities
- 1.25M driver location updates per second
- ~230 ride requests per second (average), ~1,000+ at peak
- Match latency target: <15 seconds
- Location update frequency: every 3-5 seconds
- Kafka: trillions of messages per day
- Microservices: 4,000+
```

---

## Quick Reference: Uber vs Other Companies

| Dimension | Uber | Google | Meta | Amazon |
|-----------|------|--------|------|--------|
| **Core pattern** | Geo-spatial + real-time | Search + distributed systems | Social graph + feed | E-commerce + distributed |
| **Key data structure** | Spatial index (H3) | Inverted index | Graph (adjacency list) | Key-value + queue |
| **Messaging** | Kafka (massive) | Pub/Sub | TAO + Wormhole | SQS/Kinesis |
| **DB preference** | Custom (Schemaless) + Cassandra | Spanner + Bigtable | TAO + MySQL | DynamoDB |
| **Interview focus** | Real-time, maps, marketplace | Scale, correctness | Feed, ranking | Availability, customer |
| **Unique challenge** | Physical world constraints | Globally consistent data | Social graph at scale | Inventory + logistics |

---

## Additional Resources

- **Uber Engineering Blog:** eng.uber.com — the single best preparation resource
- **H3 Documentation:** h3geo.org — understand the API and concepts
- **Uber's Open Source:** github.com/uber — study Ringpop, H3, Cadence, Jaeger
- **Case study:** [[05_case_studies/design_ride_sharing]] — practice this until perfect
- **Autocomplete (for search features):** [[05_case_studies/design_search_autocomplete]]
- **Logging at scale:** [[05_case_studies/design_logging_system]] — relevant for Uber's observability
- **URL shortening (for deep links):** [[05_case_studies/design_url_shortener]]

---

> **Bottom line:** Uber interviews are domain-heavy. Generic system design knowledge
> gets you halfway — the other half is understanding geo-spatial indexing, real-time
> event streaming, and marketplace dynamics. Study H3, study Kafka, study the matching
> problem. If you can design a ride-matching system with geo-spatial depth, you can
> handle anything Uber throws at you.

---

*Return to [[17_company_interview_guide/index]]*
