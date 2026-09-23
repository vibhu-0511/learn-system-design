# Swiggy & Zomato — System Design Interview Guide

> **Hyperlocal food-tech giants of India.** Both companies operate at massive scale in
> one of the world's most complex delivery environments. Their interviews are deeply
> rooted in real-time systems, geo-spatial problems, and India-specific constraints.

Back to [[17_company_interview_guide/index]]

---

## 1. Company Overview

### 1.1 Swiggy

| Attribute | Details |
|-----------|---------|
| **Founded** | 2014, Bangalore |
| **Headquarters** | Bangalore, Karnataka |
| **Status** | Public (IPO Nov 2024, NSE/BSE) |
| **Core Products** | Swiggy Food Delivery, Instamart (quick commerce), Dineout, Genie |
| **Scale** | 500K+ restaurant partners, 300K+ delivery partners, 500+ cities |
| **Tech Stack** | Java/Kotlin (backend), React Native (mobile), Kafka, Elasticsearch, Redis |
| **Engineering Culture** | Strong microservices culture, heavy ML adoption for ETA/routing |

**Key Technical Challenges:**
- Instamart: 10-minute delivery from dark stores — inventory management + last-mile optimization
- Batching multiple orders for a single delivery partner
- Real-time demand-supply matching across 500+ cities

### 1.2 Zomato

| Attribute | Details |
|-----------|---------|
| **Founded** | 2008 (as Foodiebay), Gurugram |
| **Headquarters** | Gurugram, Haryana |
| **Status** | Public (IPO July 2021, NSE/BSE, part of Sensex) |
| **Core Products** | Zomato Food Delivery, Blinkit (quick commerce, acquired 2022), Hyperpure (B2B supplies), District (events) |
| **Scale** | 400K+ restaurant partners, 350K+ delivery partners, 800+ cities |
| **Tech Stack** | Python/Go (backend), Kotlin (Android), Swift (iOS), PostgreSQL, Redis, Kafka |
| **Engineering Culture** | Data-driven, strong experimentation culture, public tech blog |

**Key Technical Challenges:**
- Blinkit: Acquired Grofers and rebranded — managing dark store network at scale
- Hyperpure B2B supply chain optimization
- Namma Yatri style open-network considerations (ONDC)

### 1.3 Pay Bands (2025-2026 Ranges, INR LPA)

| Level | Swiggy (CTC) | Zomato (CTC) | Notes |
|-------|-------------|-------------|-------|
| **SDE-1** (0-2 yrs) | 18-28 LPA | 16-25 LPA | Swiggy slightly higher base |
| **SDE-2** (2-5 yrs) | 28-45 LPA | 25-42 LPA | Bulk of hiring at this level |
| **SDE-3 / Senior** (5-8 yrs) | 42-65 LPA | 40-60 LPA | System design weight increases |
| **Staff / Principal** (8+ yrs) | 60-95 LPA | 55-85 LPA | Rare external hires |
| **Engineering Manager** | 55-80 LPA | 50-75 LPA | People management track |

> **Note:** Both are now public companies. ESOPs/RSUs have real liquidity value.
> Zomato stock has appreciated significantly post-IPO. Swiggy stock has been more
> volatile. Factor in vesting schedules (typically 4-year vest, 1-year cliff).

### 1.4 Public Company Dynamics

- **Profitability pressure:** Both companies have been under investor pressure to show
  path to profitability. This affects engineering — emphasis on cost optimization,
  infrastructure efficiency, reducing cloud bills.
- **ONDC threat:** Open Network for Digital Commerce could disrupt aggregator models.
  Both companies are adapting their architectures.
- **Quick commerce wars:** Instamart vs Blinkit vs Zepto is the current battleground.
  Expect system design questions around quick commerce.

---

## 2. Interview Process

### 2.1 Swiggy Interview Pipeline

```
Round 1: Online Assessment (HackerRank/HackerEarth)
   │      → 2-3 DSA problems, 90 minutes
   │      → Medium to Hard difficulty
   ▼
Round 2: Machine Coding Round
   │      → Live coding, 90 minutes
   │      → Java/Kotlin preferred (Go, Python accepted)
   │      → Design + implement a small system
   │      → Focus: SOLID principles, clean code
   │      → See [[11_lld/solid_with_refactoring]]
   ▼
Round 3: Low-Level Design (LLD)
   │      → 60 minutes
   │      → Class diagrams, API design, DB schema
   │      → See [[11_lld/examples/lld_food_delivery]]
   ▼
Round 4: High-Level Design (HLD)
   │      → 60 minutes
   │      → Full system design, scale discussion
   │      → See [[10_hld/examples/hld_food_delivery]]
   ▼
Round 5: System Design Discussion (sometimes)
   │      → Deep-dive on a specific subsystem
   │      → E.g., "How would you optimize delivery batching?"
   │      → This round is unique to Swiggy
   ▼
Round 6: Hiring Manager / Bar Raiser
         → Behavioral + culture fit
         → Past project deep dives
         → Conflict resolution, ownership stories
```

> **Swiggy-specific note:** The additional "system design discussion" round happens
> for SDE-3+ roles. It is more of a collaborative discussion than a whiteboard
> exercise. They want to see how you think about trade-offs in a real production
> environment.

### 2.2 Zomato Interview Pipeline

```
Round 1: Online Assessment
   │      → 2-3 DSA problems, 75-90 minutes
   │      → Similar difficulty to Swiggy
   ▼
Round 2: Machine Coding Round
   │      → 90 minutes
   │      → Build a working system from scratch
   │      → Python/Go/Java accepted
   │      → Emphasis on extensibility and testability
   ▼
Round 3: LLD Round
   │      → 60 minutes
   │      → Object-oriented design
   │      → Design patterns, SOLID
   ▼
Round 4: HLD Round
   │      → 60 minutes
   │      → Distributed systems design
   │      → Hyperlocal focus
   ▼
Round 5: Hiring Manager
         → Behavioral, past experience
         → "Why Zomato?" is asked seriously
```

### 2.3 Key Differences Between Swiggy and Zomato Interviews

| Aspect | Swiggy | Zomato |
|--------|--------|--------|
| **Language preference** | Java/Kotlin strongly preferred | More flexible (Python/Go/Java) |
| **Machine coding** | Stricter on OOP and design patterns | Slightly more flexible on approach |
| **HLD focus** | Delivery optimization, Instamart | Restaurant discovery, Blinkit |
| **Extra round** | System design discussion (SDE-3+) | Usually not |
| **Bar raiser** | Formal bar raiser process | HM round covers this |
| **Turnaround** | 2-3 weeks typically | 1-2 weeks, faster process |

### 2.4 Machine Coding — Common Problems

These are frequently asked in the machine coding round at both companies:

1. **Design a Food Ordering System** — Cart, menu, order placement (no delivery)
2. **Design a Coupon Engine** — Apply rules, stacking, expiry
3. **Design a Delivery Assignment System** — Match orders to delivery partners
4. **Design a Rating/Review System** — CRUD with aggregation
5. **Design a Splitwise-like Bill Splitter** — Common warm-up problem
6. **Design a Parking Lot** — Classic OOP, still asked

> **Tip:** Practice building complete working systems in 90 minutes. Not just the
> class structure — write working code with proper input/output handling.

---

## 3. System Design Round Details

### 3.1 What Makes These Interviews Unique

Both Swiggy and Zomato operate **hyperlocal platforms**. This means:

1. **Everything is geo-spatial.** You must think in terms of lat/long, geohashes,
   delivery radii, and spatial indexing.
2. **Real-time is critical.** Order tracking, ETA updates, partner location pings —
   all happen in real-time with sub-second expectations.
3. **Three-sided marketplace.** Customer, restaurant, delivery partner — all three
   need to be satisfied simultaneously.
4. **India-specific constraints** are non-negotiable. If you design for ideal US
   conditions, you will fail. See Section 6.

### 3.2 Core Technical Themes

Interviewers at both companies look for depth in these areas:

**Real-Time Location Tracking**
- Delivery partners send location pings every 3-5 seconds
- WebSocket connections for live tracking on customer app
- See [[05_case_studies/design_ride_sharing]] for similar patterns
- Location data volume: 300K partners x 1 ping/4s = 75K writes/second

**ETA Prediction**
- Restaurant preparation time (varies by dish, time of day, restaurant load)
- Travel time (traffic, weather, road conditions)
- ML models combining historical data + real-time signals
- See [[05_case_studies/design_google_maps]] for routing fundamentals

**Search and Discovery**
- Restaurant search with filters (cuisine, rating, delivery time, price)
- Geo-bounded search (only show restaurants that deliver to user's location)
- Personalized ranking (past orders, preferences)
- See [[05_case_studies/design_search_autocomplete]]

**Order Lifecycle Management**
- State machine: Placed → Confirmed → Preparing → Ready → Picked Up → Delivered
- Each transition triggers notifications, ETA recalculations, partner updates
- Idempotency is critical — network issues cause duplicate requests
- See [[05_case_studies/design_notification_system]]

### 3.3 Scale Numbers to Know

| Metric | Swiggy | Zomato | Use in Estimation |
|--------|--------|--------|-------------------|
| Daily orders | ~2.5M | ~2.5M | Peak: 3-4x average |
| Monthly active users | ~50M | ~45M | DAU ~ 15-20% of MAU |
| Restaurant partners | 500K+ | 400K+ | Active at any time: ~60% |
| Delivery partners | 300K+ | 350K+ | Online at any time: ~40% |
| Avg delivery time | 30-35 min | 28-33 min | Target < 30 min |
| Location pings/sec | ~75K | ~85K | Per partner: 1 every 4s |
| Search queries/sec | ~10K | ~12K | Peak during meal times: 3x |

Use [[07_interview_framework/estimation_cheat_sheet]] for back-of-envelope calculations.

---

## 4. Top 10 Most-Asked System Design Questions

### Q1: Design a Food Delivery System (End-to-End)

**Frequency:** Asked in almost every HLD round at both companies.

**Key components:**
- User service, restaurant service, order service, delivery service, payment service
- Real-time tracking via WebSockets
- Order state machine with event-driven transitions
- Delivery partner matching algorithm

**Deep dive:** [[10_hld/examples/hld_food_delivery]] and [[12_hld_lld_bridge/zoom_food_delivery]]

**What interviewers look for:** Don't just draw boxes. Show the delivery optimization
layer — how you match orders to partners, handle batching, and predict ETAs.

---

### Q2: Design Restaurant Search with Filters

**Frequency:** Very common at Zomato (discovery is their DNA).

**Key components:**
- Elasticsearch for full-text search + faceted filters
- Geo-spatial index (geohash-based) to filter by delivery radius
- Ranking algorithm: relevance + distance + rating + delivery time + personalization
- Caching hot queries per geohash region — see [[02_building_blocks/caching]]

**Vault reference:** [[05_case_studies/design_search_autocomplete]]

**Zomato twist:** They may ask how to handle restaurant menus in multiple languages
(Hindi, Tamil, Telugu, etc.) — think about search in regional languages.

---

### Q3: Design Real-Time Delivery Tracking

**Frequency:** Common at both, especially Swiggy.

**Key components:**
- Delivery partner app sends GPS coordinates every 3-5 seconds
- Backend ingests via Kafka, stores in time-series DB (or Redis with TTL)
- Customer app connects via WebSocket for live updates
- Map rendering with polyline for route visualization
- ETA recalculation on each location update

**Vault reference:** [[05_case_studies/design_ride_sharing]] — delivery tracking is
architecturally very similar to ride tracking.

**Scale concern:** 300K+ active partners, each pinging every 4 seconds = 75K writes/sec.
Use [[08_reference/latency_numbers]] to justify your storage choices.

---

### Q4: Design Swiggy Instamart / Blinkit (Quick Commerce)

**Frequency:** Increasingly common. This is the current battleground.

**Key components:**
- **Dark store management:** Inventory tracking per store, auto-replenishment
- **10-minute delivery promise:** Aggressive routing, pre-positioned inventory
- **Demand forecasting:** ML model predicts demand per SKU per dark store per hour
- **Order batching:** Multiple orders from same dark store, same direction
- **Inventory reservation:** Prevent overselling with distributed locks

**Architecture differences from food delivery:**
```
Food Delivery:                    Quick Commerce:
- Restaurant prepares (15-20 min) - Dark store picks (2-3 min)
- Variable prep time              - Predictable prep time
- Restaurant is third party       - Dark store is owned/operated
- Menu changes often              - Catalog is managed centrally
- Single restaurant per order     - Multiple items from one store
```

**Key trade-off discussion:** How to decide which items to stock in which dark store?
This is a constraint optimization problem with warehouse capacity limits.

---

### Q5: Design Delivery Agent Assignment / Routing

**Frequency:** Very common, especially for senior roles.

**Key components:**
- **Assignment algorithm:** Match orders to nearest available delivery partner
- **Factors:** Distance to restaurant, partner's current direction, rating, vehicle type
- **Batching:** Assign 2-3 orders to same partner if restaurants are close and
  destinations are roughly in the same direction
- **Rebalancing:** Move idle partners to high-demand zones proactively

**Algorithm approach:**
```
1. Order comes in
2. Find all available partners within R km of restaurant
3. Score each partner:
   score = w1 * (1/distance) + w2 * partner_rating + w3 * direction_alignment
           + w4 * current_load_factor
4. Assign to highest scoring partner
5. If no partner available, expand radius and retry with backoff
```

**Related patterns:**
- [[03_design_patterns/consistent_hashing]] — for partitioning the geo-space
- Quadtree or geohash-based spatial indexing for finding nearby partners

---

### Q6: Design Review / Rating System

**Frequency:** Common for SDE-2 level, often in LLD round.

**Key components:**
- Ratings for restaurants, delivery partners, and individual dishes
- Write-heavy during post-delivery window, read-heavy always
- Aggregate ratings (average, distribution) must be eventually consistent
- Fake review detection (ML-based flagging)
- Photo reviews with moderation pipeline

**LLD focus:** Event sourcing for rating changes, CQRS for read/write separation.
See [[11_lld/examples/lld_food_delivery]] for order-adjacent modeling.

---

### Q7: Design Order Management System

**Frequency:** Common, especially at Swiggy.

**Key components:**
- Order state machine (see Section 3.2)
- Event-driven architecture — each state transition publishes to Kafka
- Compensation/rollback for failed orders (Saga pattern)
- Idempotent order placement (network retries must not create duplicate orders)
- SLA monitoring — alert if order stuck in any state too long

**Vault reference:** [[11_lld/examples/lld_food_delivery]]

**Message queue usage:** [[02_building_blocks/message_queues]] and [[03_design_patterns/pub_sub]]

---

### Q8: Design Surge Pricing for Delivery

**Frequency:** Asked at both companies, especially for senior roles.

**Key components:**
- **Demand-supply ratio per zone:** High demand + low supply = surge
- **Zone definition:** City divided into hexagonal zones (H3 from Uber, or geohash grid)
- **Dynamic pricing model:**
  ```
  surge_multiplier = f(demand_in_zone / supply_in_zone, time_of_day, weather, events)
  ```
- **Gradual ramp:** Don't jump from 1x to 3x — step through 1.2x, 1.5x, 2x
- **Cooldown period:** Prevent oscillation (surge on → partners rush in → surge off → repeat)
- **Transparency:** Show customers why surge is applied (rain, high demand, etc.)

**Related:** [[05_case_studies/design_rate_limiter]] — rate limiting prevents abuse
of pricing APIs.

---

### Q9: Design Coupon / Promo Engine

**Frequency:** Common at both, especially in machine coding rounds.

**Key components:**
- **Rule engine:** Conditions (min order value, cuisine type, first order, etc.)
- **Types:** Flat discount, percentage off, cashback, free delivery, BOGO
- **Budget management:** Track total spend per campaign in real-time
- **Fraud prevention:** Device fingerprinting, account linking, velocity checks
- **Stacking rules:** Which coupons can combine, priority ordering

**Architecture:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Coupon CRUD  │────▶│ Rule Engine  │────▶│ Budget Tracker│
│   Service    │     │  (evaluate)  │     │   (Redis)     │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                     ┌─────▼─────┐
                     │  Fraud    │
                     │  Checker  │
                     └───────────┘
```

**Flash sale angle:** During festivals, coupons can cause flash-sale-like traffic.
See [[05_case_studies/design_flash_sale]].

---

### Q10: Design Zomato Gold / Pro Subscription

**Frequency:** Zomato-specific, but Swiggy also has Swiggy One.

**Key components:**
- **Subscription lifecycle:** Purchase, activate, renew, cancel, pause
- **Benefit application:** Free delivery, extra discounts applied at checkout
- **Revenue tracking:** Subscription revenue vs. per-order revenue attribution
- **Trial management:** Free trial → paid conversion, prevent trial abuse
- **Partner settlement:** How costs of "free delivery" are split between platform and restaurant

**Technical considerations:**
- Eventual consistency OK for benefit display, but strong consistency needed for
  benefit application at checkout (double-spending prevention)
- See [[02_building_blocks/caching]] for caching subscription status (read-heavy)

---

## 5. Hyperlocal-Specific Patterns

These patterns come up repeatedly in Swiggy/Zomato interviews. Understanding them
deeply sets you apart from generic system design preparation.

### 5.1 Geo-Spatial Indexing for Restaurants

**Problem:** Given a user's location, find all restaurants that can deliver to them.

**Approach 1: Geohash-based indexing**
```
- Divide the world into geohash cells (e.g., precision 6 = ~1.2 km x 0.6 km)
- Each restaurant is tagged with its geohash
- For a user location, compute geohash + neighboring cells
- Query: SELECT * FROM restaurants WHERE geohash IN (cell, neighbors)
- Post-filter by exact distance
```

**Approach 2: Quadtree**
```
- Recursively divide space into quadrants
- Each leaf node contains restaurants in that region
- Range query: traverse tree, collect all restaurants within radius
- Better for non-uniform distribution (dense urban + sparse suburban)
```

**Approach 3: H3 (Hexagonal Hierarchical Index)**
```
- Used by Uber, increasingly adopted by Swiggy/Zomato
- Hexagonal cells have uniform adjacency (6 neighbors, all equidistant)
- Better than square geohash for distance calculations
- Resolution 9 ≈ 100m edge length — good for delivery zone modeling
```

**What interviewers want:** Don't just say "use geohash." Explain WHY hexagonal
indexing is better for delivery radius calculations and how you'd handle edge cases
(restaurant near geohash boundary).

### 5.2 Delivery Radius Optimization

**Problem:** A restaurant's delivery radius is not a simple circle.

**Reality:**
- Roads are not straight lines — actual travel time matters more than distance
- A restaurant 3 km away via highway is faster than 1.5 km through congested lanes
- Delivery radius should be based on isochrone maps (areas reachable within X minutes)

**Implementation:**
```
1. Pre-compute isochrone polygons for each restaurant at intervals (15, 25, 35 min)
2. Store as polygons in PostGIS
3. User location check: ST_Contains(isochrone_polygon, user_point)
4. Update isochrones periodically (traffic patterns change by time of day)
```

### 5.3 Order Batching

**Problem:** Assign multiple orders to one delivery partner to improve efficiency.

**Constraints:**
- Maximum 2-3 orders per batch
- All pickups should be near each other (< 1 km)
- All deliveries should be roughly in the same direction
- No single order's delivery time should increase by more than 10 minutes
- Food quality degradation for earliest picked-up order

**Algorithm sketch:**
```
function batchOrders(pendingOrders, availablePartners):
    clusters = clusterByPickupLocation(pendingOrders, maxRadius=1km)
    for each cluster:
        subsets = generateSubsets(cluster, maxSize=3)
        for each subset:
            route = computeOptimalRoute(subset)  // TSP variant
            if route.maxDelayForAnyOrder < 10min:
                score = savings(route) - qualityPenalty(route)
                candidateRoutes.add(route, score)
    assign top-scoring routes to nearest available partners
```

### 5.4 Dark Store Architecture (Instamart / Blinkit)

**Dark store** = mini-warehouse optimized for online order fulfillment, not walk-in customers.

**Key system components:**
```
┌─────────────────────────────────────────────────────┐
│                   Dark Store System                   │
├─────────────┬──────────────┬────────────────────────┤
│  Inventory  │   Picking    │    Demand Forecasting   │
│  Management │   System     │    & Auto-Replenishment │
├─────────────┼──────────────┼────────────────────────┤
│ - SKU-level │ - Pick list  │ - Per-SKU demand curve  │
│   tracking  │   generation │ - Weather correlation   │
│ - Real-time │ - Bin        │ - Festival calendar     │
│   stock     │   location   │ - Reorder point calc    │
│   updates   │   mapping    │ - Supplier lead time    │
│ - Expiry    │ - Batch      │ - Safety stock levels   │
│   tracking  │   picking    │                         │
└─────────────┴──────────────┴────────────────────────┘
```

**10-minute delivery SLA breakdown:**
- Order placement + payment: 30 seconds
- Order reaching dark store: 5 seconds (via Kafka)
- Picking items: 2-3 minutes
- Packing: 30 seconds
- Partner pickup: 1-2 minutes (partner pre-positioned near store)
- Last-mile delivery: 4-5 minutes (< 2 km radius)

### 5.5 ETA Prediction

**Three components of ETA:**

```
Total ETA = Restaurant Prep Time + Partner Travel to Restaurant + Delivery Time
```

**Restaurant prep time prediction:**
- Historical average per restaurant
- Adjusted for: current order queue depth, time of day, specific items ordered
- ML model: gradient boosted trees on features like order complexity, restaurant load

**Travel time prediction:**
- Base: Google Maps / OSM routing
- Adjustments: real-time traffic, weather, road closures
- Partner-specific: vehicle type (bike vs scooter), historical speed

**Continuous ETA updates:**
- Recalculate every time partner location is updated
- Smooth the ETA (don't show jumpy numbers to customers)
- If ETA breach likely, proactively notify customer

See [[05_case_studies/design_google_maps]] for routing algorithm fundamentals.

### 5.6 Delivery Partner Allocation Algorithms

**Naive approach:** Assign to nearest available partner.

**Better approach — Hungarian Algorithm variant:**
```
Problem: N orders, M partners — minimize total cost
Cost matrix: C[i][j] = cost of assigning order i to partner j
Cost factors:
  - Distance from partner to restaurant
  - Estimated delivery time
  - Partner fatigue (hours worked, orders completed)
  - Partner preference (veg-only, high-value orders)
  - Customer SLA risk

Solve: Minimum cost bipartite matching
Recompute every 30 seconds for new orders/partners
```

**Real-world complication:** This is not a static assignment. Orders keep coming in,
partners keep moving. The system uses a rolling window approach — batch assignments
every 30-60 seconds rather than assigning immediately.

### 5.7 COD (Cash on Delivery) Handling

**Why this matters:** In India, ~15-20% of food delivery orders are still COD.

**System design implications:**
- Delivery partner must collect cash → cash reconciliation system
- Daily settlement: partner deposits cash, system credits their wallet
- Fraud risk: partner marks order as delivered without collecting cash
- COD orders have higher cancellation rates → impact on restaurant

**Architecture addition:**
```
┌────────────┐     ┌──────────────┐     ┌──────────────┐
│ Order with │────▶│ COD Tracking │────▶│ Reconciliation│
│  COD flag  │     │   Service    │     │   Service     │
└────────────┘     └──────────────┘     └──────────────┘
                         │                      │
                   Cash collection         Daily settlement
                   confirmation            with partner wallet
```

---

## 6. India-Specific Constraints

> **This section is critical.** Generic system design answers that ignore India's
> ground reality will not impress Swiggy/Zomato interviewers.

### 6.1 Variable Network Quality

**The problem:**
- Delivery partners often operate in areas with 2G/3G connectivity
- App must continue functioning with intermittent network
- GPS accuracy drops in dense urban areas (buildings, narrow lanes)

**Design solutions:**
- **Offline-first partner app:** Queue location updates locally, batch-send when connected
- **Lightweight payloads:** Protobuf instead of JSON, minimal data transfer
- **Progressive loading on customer app:** Show cached restaurant data immediately,
  update asynchronously
- **Graceful degradation:** If real-time tracking fails, show estimated position
  based on last known location + expected route
- **Retry with exponential backoff** — see [[03_design_patterns/circuit_breaker]]

### 6.2 Low-End Android Devices

**The problem:**
- Most delivery partners use phones with 2-3 GB RAM, budget chipsets
- Partner app must run alongside navigation and phone calls
- Customer base also includes budget phone users

**Design solutions:**
- Partner app: Native (Kotlin), minimal background processes, < 50 MB APK
- Avoid heavy map rendering on partner app — use simplified route display
- Lazy loading of images, aggressive image compression (WebP)
- Minimal local storage usage, periodic cache cleanup

### 6.3 Regional Languages

**The problem:**
- India has 22 official languages, 100+ regional languages
- Restaurant names, menus, and reviews in multiple scripts
- Delivery partner instructions often in local language

**Design solutions:**
- Multilingual search: transliteration support (searching "biryani" in English
  should match "बिरयानी" in Hindi menus)
- Elasticsearch with ICU plugins for multi-script tokenization
- Dynamic language switching without app restart
- Voice-based features for low-literacy delivery partners

### 6.4 Festival and IPL Traffic Spikes

**The problem:**
- IPL match nights: 2-3x normal order volume concentrated in 3-hour window
- Festivals (Diwali, Eid, Christmas): 4-5x normal volume
- New Year's Eve: 5-7x spike in specific cities
- These are predictable but extreme spikes

**Design solutions:**
- **Pre-scaling:** Spin up additional instances 2 hours before predicted spike
- **Queue-based load leveling:** Orders enter Kafka queue, processed at sustainable rate
- **Feature degradation:** Disable non-essential features during peak
  (e.g., personalized recommendations, detailed analytics)
- **Rate limiting per user:** Prevent bot/script abuse during peak
  — see [[05_case_studies/design_rate_limiter]]
- **Restaurant capacity capping:** Temporarily limit orders per restaurant
  to maintain quality

```
Normal day:        ████████████████████████
                   12PM        8PM

IPL match night:   ████████████████████████████████████████████
                   12PM    7PM ══════════╗ 10PM
                                IPL window (3x spike)

Diwali evening:    ████████████████████████████████████████████████████
                   12PM            6PM ═══════════════╗ 11PM
                                      Festival window (5x spike)
```

### 6.5 Monsoon Impact on Delivery

**The problem:**
- Indian monsoon (June-September) affects delivery significantly
- Waterlogged roads, reduced visibility, partner safety
- Delivery times increase 40-60% during heavy rain
- Partner supply drops (fewer willing to ride in rain)

**Design solutions:**
- **Dynamic ETA adjustment:** Weather-aware ETA model, adjust by 1.4-1.6x in rain
- **Surge pricing activation:** Incentivize partners to stay online
- **Proactive communication:** Push notification to customers about expected delays
- **Safety features:** Allow partners to mark themselves as "waiting out rain"
  without penalizing them
- **Route adjustment:** Avoid known waterlogging-prone roads (historical data)

### 6.6 Tier-2 and Tier-3 City Expansion

**The problem:**
- Different infrastructure: fewer restaurants, less dense delivery networks
- Different user behavior: higher COD percentage, lower order values
- Different economics: lower delivery fees, need for cost optimization

**Design solutions:**
- **Configurable delivery radius:** Larger radius in less dense cities
- **Hybrid model:** Part-time delivery partners (not full-time fleet)
- **Lower infrastructure costs:** Smaller Kafka clusters, shared microservices
  across cities — multi-tenancy at the infrastructure level
- **Localized onboarding:** Simplified restaurant onboarding for smaller establishments

---

## 7. Sample Walkthrough: Design Food Delivery System

Follow [[07_interview_framework/the_four_step_framework]] throughout.

### Step 1: Requirements Clarification (5 minutes)

**Functional requirements:**
- Customers can browse restaurants, search menus, place orders
- Restaurants receive orders, update preparation status
- Delivery partners are assigned, pick up, and deliver
- Real-time tracking of delivery
- Ratings and reviews post-delivery
- Payment: UPI, cards, wallets, COD

**Non-functional requirements:**
- Availability: 99.99% (food delivery is time-sensitive)
- Latency: Search < 200ms, order placement < 500ms
- Scale: 2.5M orders/day, peak 3-4x
- Consistency: Order and payment must be strongly consistent
- Location tracking: Near real-time (< 5 second delay)

**Back-of-envelope estimation:**
- 2.5M orders/day = ~30 orders/second average, ~120/sec peak
- 300K delivery partners, 40% online = 120K active
- Location updates: 120K / 4 seconds = 30K writes/second
- Search: ~10K QPS average, ~30K peak
- Storage: Order data ~1 KB x 2.5M/day = 2.5 GB/day = ~900 GB/year

### Step 2: High-Level Design (15 minutes)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Customer   │  │ Restaurant  │  │  Delivery    │
│    App      │  │   App/Tab   │  │ Partner App  │
└──────┬──────┘  └──────┬──────┘  └──────┬───────┘
       │                │                │
       └────────┬───────┴────────┬───────┘
                │                │
         ┌──────▼──────┐  ┌─────▼──────┐
         │   API GW    │  │  WebSocket │
         │  (Kong)     │  │   Gateway  │
         └──────┬──────┘  └─────┬──────┘
                │               │
    ┌───────────┼───────────────┼──────────────┐
    │           │               │              │
┌───▼───┐ ┌────▼────┐ ┌───────▼──────┐ ┌─────▼─────┐
│ User  │ │  Order  │ │   Delivery   │ │Restaurant │
│Service│ │ Service │ │   Service    │ │  Service  │
└───┬───┘ └────┬────┘ └───────┬──────┘ └─────┬─────┘
    │          │              │               │
    │     ┌────▼────┐  ┌─────▼──────┐        │
    │     │ Payment │  │  Location  │        │
    │     │ Service │  │  Service   │        │
    │     └─────────┘  └────────────┘        │
    │                                        │
    └──────────┬─────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │     Kafka Cluster   │
    │  (Event Backbone)   │
    └──────────┬──────────┘
               │
    ┌──────────┼──────────────────────┐
    │          │                      │
┌───▼───┐ ┌───▼───────┐ ┌───────────▼──┐
│Search │ │Notification│ │  Analytics   │
│Service│ │  Service   │ │  Pipeline    │
│(Elastic)│ │  (FCM)    │ │  (Flink)     │
└───────┘ └───────────┘ └──────────────┘
```

**Data stores:**
- **PostgreSQL:** User profiles, restaurant data, order data (strong consistency)
- **Redis:** Session cache, delivery partner locations, surge pricing state
  — see [[02_building_blocks/caching]]
- **Elasticsearch:** Restaurant search, menu search, autocomplete
- **Kafka:** Event backbone for all inter-service communication
  — see [[02_building_blocks/message_queues]]
- **TimescaleDB / InfluxDB:** Location time-series data, analytics
- **S3:** Images (food photos, restaurant logos)

### Step 3: Deep Dive — Delivery Optimization (20 minutes)

This is where Swiggy/Zomato interviews go deep. Pick delivery optimization as
the deep-dive topic.

**3a. Order Assignment Flow:**

```
Order Placed
    │
    ▼
┌──────────────────────┐
│ Find available        │
│ partners within 5 km  │ ◄── Geo-spatial query on Redis (geohash)
│ of restaurant         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Score each partner    │
│ - Distance: 40%      │
│ - Direction: 25%     │
│ - Rating: 15%        │
│ - Fatigue: 10%       │
│ - Vehicle type: 10%  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Check batching        │
│ opportunity           │ ◄── Can we club this with an existing order?
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
  Batch        Solo
  assignment   assignment
    │             │
    └──────┬──────┘
           │
           ▼
┌──────────────────────┐
│ Send assignment to    │
│ partner app (push)    │ ◄── Partner has 30 seconds to accept
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
  Accept       Reject/Timeout
    │             │
    ▼             ▼
  Confirmed    Reassign to
               next best partner
```

**3b. Location Tracking Architecture:**

```
Partner App                    Backend                         Customer App
    │                             │                                │
    │──── GPS ping (lat,lng) ────▶│                                │
    │     via MQTT/HTTP           │                                │
    │                      ┌──────▼──────┐                        │
    │                      │  Location   │                        │
    │                      │  Ingestion  │                        │
    │                      │  (Kafka)    │                        │
    │                      └──────┬──────┘                        │
    │                             │                                │
    │                      ┌──────▼──────┐     ┌──────────┐      │
    │                      │   Redis     │────▶│  ETA     │      │
    │                      │ (latest pos)│     │ Compute  │      │
    │                      └──────┬──────┘     └────┬─────┘      │
    │                             │                  │             │
    │                      ┌──────▼──────┐          │             │
    │                      │  WebSocket  │◄─────────┘             │
    │                      │  Gateway    │                        │
    │                      └──────┬──────┘                        │
    │                             │──── location + ETA ──────────▶│
    │                             │     via WebSocket              │
```

**3c. Handling the Three-Sided SLA:**

| Stakeholder | SLA | Enforcement |
|-------------|-----|-------------|
| Customer | Delivery within promised ETA | Compensation if breached |
| Restaurant | Order confirmed within 30s | Auto-confirm after timeout |
| Delivery Partner | Fair assignment, no overload | Max 3 concurrent orders |

### Step 4: Bottlenecks and Trade-offs (5 minutes)

**Bottleneck 1: Partner location hotspot**
- Redis with 30K writes/sec for location updates
- Solution: Shard by city/zone using [[03_design_patterns/consistent_hashing]]

**Bottleneck 2: Search during peak hours**
- 30K QPS on Elasticsearch during IPL nights
- Solution: Read replicas + query-level caching (cache popular geohash queries)

**Bottleneck 3: Order service under peak load**
- 120 orders/sec peak, each triggering multiple downstream events
- Solution: Kafka as buffer, order service writes to DB and publishes event,
  downstream consumers process asynchronously

**Bottleneck 4: Payment failures**
- UPI/payment gateway timeouts during peak
- Solution: Async payment confirmation, place order optimistically, handle
  payment failure with compensation (cancel order)

**Trade-off discussion:**
- **Consistency vs. availability for order placement:** Choose consistency (CP).
  A customer must not be charged twice or have a ghost order.
- **Eventual consistency for tracking:** OK to show partner location that is
  3-5 seconds old. AP system is fine here.
- **Pre-computation vs. real-time for ETA:** Pre-compute base ETAs per zone-pair,
  adjust in real-time. Hybrid approach.

---

## 8. Red Flags and Green Flags

### Red Flags (What Gets You Rejected)

| Red Flag | Why It Matters |
|----------|---------------|
| **Ignoring geo-spatial aspect** | Everything in food delivery is location-based |
| **Single database for everything** | Shows lack of understanding of scale |
| **No mention of delivery partner** | It's a three-sided marketplace, not two-sided |
| **"Just use Google Maps API"** | They want to see YOUR routing/ETA design |
| **Ignoring India constraints** | Network quality, COD, regional languages matter |
| **No back-of-envelope math** | Must estimate scale for Swiggy/Zomato specifically |
| **Overengineering for day 1** | Start simple, explain how you'd evolve |
| **Not discussing trade-offs** | Every design choice has a cost |
| **Generic microservices diagram** | Drawing boxes without explaining interactions |
| **No mention of failure handling** | What happens when payment fails mid-order? |

### Green Flags (What Gets You Hired)

| Green Flag | How to Demonstrate |
|------------|-------------------|
| **Geo-spatial depth** | Discuss geohash vs. quadtree vs. H3, with trade-offs |
| **Three-sided marketplace thinking** | Address customer, restaurant, AND partner needs |
| **India-aware design** | Mention 2G networks, monsoon, COD, festival spikes |
| **Delivery optimization depth** | Batching, assignment algorithms, ETA prediction |
| **Real-time systems knowledge** | WebSocket vs. SSE, MQTT for partners, location ingestion at scale |
| **Data-driven decisions** | "We'd A/B test the assignment algorithm" |
| **Operational thinking** | Monitoring, alerting, graceful degradation |
| **Cost awareness** | "As a public company, cloud costs matter — here's how we optimize" |
| **Progressive detail** | Start high-level, zoom into delivery optimization naturally |
| **Failure mode discussion** | Proactively address: partner no-show, restaurant closed, payment timeout |

---

## 9. Preparation Checklist

### Week 1-2: Foundations

- [ ] Complete [[07_interview_framework/the_four_step_framework]]
- [ ] Study [[08_reference/latency_numbers]] — know your numbers cold
- [ ] Review [[02_building_blocks/caching]] and [[02_building_blocks/message_queues]]
- [ ] Practice back-of-envelope estimation with [[07_interview_framework/estimation_cheat_sheet]]
- [ ] Read Swiggy and Zomato engineering blogs:
  - Swiggy: bytes.swiggy.com
  - Zomato: www.zomato.com/blog/category/technology

### Week 2-3: Core Case Studies

- [ ] [[10_hld/examples/hld_food_delivery]] — complete walkthrough
- [ ] [[11_lld/examples/lld_food_delivery]] — class-level design
- [ ] [[12_hld_lld_bridge/zoom_food_delivery]] — connecting HLD to LLD
- [ ] [[05_case_studies/design_ride_sharing]] — delivery tracking parallels
- [ ] [[05_case_studies/design_google_maps]] — ETA and routing
- [ ] [[05_case_studies/design_search_autocomplete]] — restaurant search

### Week 3-4: Hyperlocal Deep Dives

- [ ] Study geo-spatial indexing: geohash, quadtree, H3 hexagonal index
- [ ] Understand order batching algorithms (multi-stop TSP variants)
- [ ] Learn about dark store operations (Instamart/Blinkit model)
- [ ] Review surge pricing models (adapt from Uber's model)
- [ ] Study Indian payment systems: UPI, wallets, COD reconciliation
- [ ] Practice explaining delivery partner assignment algorithm

### Week 4: Mock Interviews and Polish

- [ ] Do 2-3 mock system design interviews focused on food delivery
- [ ] Practice the "Swiggy-specific" deep dive round (collaborative discussion)
- [ ] Review [[05_case_studies/design_notification_system]] — for real-time updates
- [ ] Review [[05_case_studies/design_distributed_cache]] — for location caching
- [ ] Review [[03_design_patterns/circuit_breaker]] — for handling partner app disconnects
- [ ] Prepare behavioral stories: ownership, conflict resolution, scale challenges
- [ ] Read recent Swiggy/Zomato news — ONDC, profitability, quick commerce wars

### Machine Coding Preparation

- [ ] Practice building a complete system in 90 minutes (timed)
- [ ] Review [[11_lld/solid_with_refactoring]] for SOLID principles
- [ ] Common patterns: Strategy, Observer, Factory, Builder
- [ ] Have a template ready: Main class, models, services, repositories
- [ ] Practice in Java if targeting Swiggy specifically

### Day-Before Checklist

- [ ] Review the scale numbers from Section 3.3
- [ ] Re-read this guide's Section 7 (sample walkthrough)
- [ ] Memorize: 2.5M orders/day, 30K location writes/sec, 10K search QPS
- [ ] Have your "start here" template ready for the HLD round
- [ ] Sleep well — these are long interview loops (4-6 hours)

---

## Quick Reference: Key System Design Patterns for Food Delivery

| Pattern | Usage in Food Delivery | Vault Link |
|---------|----------------------|------------|
| Pub/Sub | Order events, status updates | [[03_design_patterns/pub_sub]] |
| Consistent Hashing | Geo-sharding location data | [[03_design_patterns/consistent_hashing]] |
| Circuit Breaker | Payment gateway, partner app | [[03_design_patterns/circuit_breaker]] |
| CQRS | Order reads vs writes, search vs catalog | — |
| Event Sourcing | Order state transitions | — |
| Saga Pattern | Distributed order-payment-delivery transaction | — |
| Rate Limiting | API protection during peak | [[05_case_studies/design_rate_limiter]] |
| Caching | Restaurant data, menu, search results | [[02_building_blocks/caching]] |

---

## Related Resources

- [[10_hld/examples/hld_food_delivery]] — Full HLD walkthrough
- [[11_lld/examples/lld_food_delivery]] — Full LLD walkthrough
- [[12_hld_lld_bridge/zoom_food_delivery]] — Connecting HLD to LLD
- [[05_case_studies/design_ride_sharing]] — Delivery tracking parallels
- [[05_case_studies/design_google_maps]] — ETA and routing
- [[05_case_studies/design_notification_system]] — Push notifications
- [[05_case_studies/design_flash_sale]] — Festival traffic handling
- [[05_case_studies/design_distributed_cache]] — Location caching
- [[05_case_studies/design_chat_system]] — Customer-partner chat
- [[05_case_studies/design_logging_system]] — Observability at scale
- [[05_case_studies/design_url_shortener]] — Deep link sharing

---

*Last updated: 2026-02-23*
