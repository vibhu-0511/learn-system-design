# Flipkart — System Design Interview Guide

> **Back to:** [[17_company_interview_guide/index]]
> **Framework:** [[07_interview_framework/the_four_step_framework]]
> **Last updated:** 2026-02-23

---

## 1. Company Overview

### Who Is Flipkart?

Flipkart is **India's largest e-commerce platform**, founded in 2007 by Sachin Bansal
and Binny Bansal (ex-Amazon engineers, no relation). Acquired by **Walmart in 2018
for $16 billion** — the largest e-commerce acquisition in history at that time. Flipkart
operates as a subsidiary but retains its brand, engineering culture, and Bangalore HQ.

Key numbers:
- **400M+ registered users**
- **150M+ products** across 80+ categories
- **Big Billion Days (BBD)** generates $2B+ GMV in a single week
- **~10,000 engineers** across Bangalore, Chennai, and Hyderabad
- Subsidiaries: Myntra (fashion), PhonePe (payments), Cleartrip (travel), Shopsy

### Engineering Culture

Flipkart engineering culture is **Java-first and design-obsessed**. They take object-
oriented design extremely seriously — more so than most Indian tech companies. The
interview process reflects this: you must write real, compilable Java code under time
pressure.

- **Primary stack:** Java 17+, Spring Boot, Dropwizard, MySQL, Redis, Kafka, Elasticsearch
- **Infrastructure:** Kubernetes on private cloud (Flipkart Cloud Platform / FCP)
- **Data:** Apache Flink, Spark, custom data pipelines
- **Frontend:** React (web), Kotlin/Swift (mobile)
- **Microservices architecture** — migrated from a monolith around 2014-2015

### Pay Bands (Bangalore, 2025-2026 estimates)

| Level | Title | Base (LPA) | Total Comp (LPA) | YoE (typical) |
|-------|-------|-----------|-------------------|----------------|
| SDE-1 | Software Development Engineer I | 18-25L | 22-30L | 0-2 |
| SDE-2 | Software Development Engineer II | 28-38L | 35-50L | 2-5 |
| SDE-3 | Senior SDE | 40-55L | 55-75L | 5-8 |
| Staff / Tech Lead | Staff Engineer | 55-70L | 75-100L | 8-12 |
| Principal | Principal Engineer | 75-95L | 100-140L+ | 12+ |
| Architect | Distinguished / Architect | 90L+ | 130-180L+ | 15+ |

> **Note:** Flipkart RSUs vest over 4 years. Walmart stock (WMT) is the equity
> component. Total comp includes base + bonus (15-20%) + RSUs. ESOPs from
> pre-Walmart era have largely been bought out.

### Level Mapping (Approximate)

| Flipkart | Google | Amazon | Microsoft |
|----------|--------|--------|-----------|
| SDE-1 | L3 | SDE-I | 59-60 |
| SDE-2 | L4 | SDE-II | 61-62 |
| SDE-3 | L5 | Senior SDE | 63-64 |
| Staff | L6 | Principal | 65-66 |
| Principal | L7 | Sr. Principal | 67 |

---

## 2. Interview Process

### The Flipkart Interview Pipeline

```
Online Assessment (OA)
        │
        ▼
┌─────────────────────────────┐
│   MACHINE CODING ROUND      │  ◄── GATEKEEPER. Fail here = game over.
│   90 minutes, real Java code │
└─────────────┬───────────────┘
              │ PASS (mandatory)
              ▼
     HLD Round (45-60 min)
              │
              ▼
     LLD Round (45-60 min)
              │
              ▼
   Hiring Manager / Bar Raiser
              │
              ▼
        Offer Stage
```

### CRITICAL: Machine Coding Is the Gatekeeper

**This is what makes Flipkart unique.** At most companies, if you stumble in one
round you might still get through. At Flipkart:

> **If you fail Machine Coding, your interview process ENDS. Period.**
> You do not get to HLD. You do not get to LLD. You go home.

The machine coding round is typically Round 1 (after OA) and acts as a binary
filter. Flipkart values clean, object-oriented code so much that they will not
evaluate your system design skills if your code quality is below their bar.

### Round-by-Round Breakdown

| Round | Duration | Focus | Elimination? |
|-------|----------|-------|-------------|
| Online Assessment | 90 min | DSA (2-3 problems), MCQs | Yes |
| Machine Coding | 90 min | Working Java code, SOLID, design patterns | **YES — GATEKEEPER** |
| HLD | 45-60 min | Large-scale system design, e-commerce focus | Yes |
| LLD | 45-60 min | Class design, OOP, SOLID explanation | Yes |
| Hiring Manager | 30-45 min | Behavioral, past projects, culture fit | Yes |

### Timeline

- **OA to Machine Coding:** 3-7 days
- **Machine Coding to remaining rounds:** Usually same day or next day (all onsite)
- **Final decision:** 1-2 weeks after onsite
- **Offer rollout:** 1-2 weeks after decision

### By Level

| Level | OA | Machine Coding | HLD | LLD | HM |
|-------|-----|---------------|------|------|-----|
| SDE-1 | Yes | Yes (critical) | Light | Yes | Yes |
| SDE-2 | Yes | Yes (critical) | Yes | Yes | Yes |
| SDE-3 | Sometimes | Yes (critical) | Yes (deep) | Yes | Yes + VP |
| Staff+ | No | Sometimes | Yes (deep) | Yes | Yes + VP |

---

## 3. Machine Coding Round — Deep Dive

### The Format

- **Duration:** 90 minutes, strictly timed
- **Language:** Java is **mandatory** (no Python, no C++, no "pseudocode")
- **Environment:** Your own laptop with your IDE (IntelliJ preferred), or their machine
- **Expectation:** Working, compilable, runnable code with a `main()` method that demos the functionality
- **NOT allowed:** No internet, no pre-written templates (they check)

### What They Evaluate

| Criteria | Weight | What They Look For |
|----------|--------|--------------------|
| **Working code** | 25% | Does it compile? Does `main()` produce correct output? |
| **SOLID principles** | 25% | Single Responsibility, Open-Closed, Liskov, ISP, DIP |
| **Design patterns** | 20% | Strategy, Observer, Factory — used where appropriate |
| **Extensibility** | 15% | Can a new requirement be added without changing existing code? |
| **Code cleanliness** | 15% | Naming, structure, no God classes, proper packaging |

> **See:** [[11_lld/solid_with_refactoring]] for SOLID principle deep-dive

### Common Machine Coding Problems

These are the most frequently asked problems. Prepare ALL of them:

1. **Design Parking Lot** — The #1 most asked (see walkthrough below)
2. **Design Snake and Ladder** — Dice rolling, winner detection, special rules
3. **Design Splitwise** — Expense splitting, simplify debts
4. **Design Elevator System** — Multiple elevators, scheduling algorithms
5. **Design a Ride-Sharing Splitter** — Like Splitwise but for ride costs
6. **Design TicTacToe** — With extensible board size (NxN)
7. **Design a Vending Machine** — State machine pattern
8. **Design a Logger Library** — Strategy for log levels, multiple sinks
9. **Design a Task Scheduler** — Priority-based execution
10. **Design Cricket Scoreboard** — Real-time scoring, commentary

> **See:** [[11_lld/examples/lld_parking_lot]] for a reference parking lot design

### How to Structure Your 90 Minutes

```
Minute 0-10   → Read problem, ask clarifying questions, identify entities
Minute 10-20  → Draw class diagram on paper (quick), identify patterns
Minute 20-65  → Code. Models first, then services, then driver class
Minute 65-80  → Write main() method, test with sample scenarios
Minute 80-90  → Refactor, rename, add comments if time permits
```

**The cardinal sin:** Spending 60 minutes designing and only 30 minutes coding.
You MUST have working code. An elegant design that doesn't compile loses to a
slightly less elegant design that runs.

### Machine Coding Tips

1. **Start with models/entities** — `Car`, `ParkingSpot`, `Ticket`
2. **Use enums aggressively** — `VehicleType.CAR`, `SpotStatus.OCCUPIED`
3. **One class, one file** (conceptually) — even if you put them in one file for speed
4. **Use interfaces for strategy** — `PricingStrategy`, `AllocationStrategy`
5. **Factory pattern for creation** — `VehicleFactory.create(type)`
6. **Keep main() clean** — It should read like a story
7. **Don't over-engineer** — You have 90 minutes, not 9 hours
8. **Print output** — Show the system working with `System.out.println`

---

## 4. HLD Round Details

### Format

- **Duration:** 45-60 minutes
- **Style:** Whiteboard or Google Doc / Excalidraw
- **Focus:** E-commerce-heavy, India-scale problems
- **For SDE-2+:** They expect you to drive the discussion

### What They Evaluate in HLD

| Criteria | What They Look For |
|----------|--------------------|
| **Requirements gathering** | Do you ask about scale? DAU? Peak traffic? |
| **High-level components** | Clean boxes-and-arrows, not a mess |
| **Data model** | Entity relationships, database choices |
| **Scale handling** | How do you handle BBD-level traffic (100x normal)? |
| **Trade-offs** | SQL vs NoSQL, consistency vs availability, push vs pull |
| **India-specific awareness** | COD, regional languages, tier-2/3 network quality |

> **Use:** [[07_interview_framework/the_four_step_framework]] — Requirements → Estimation → Design → Deep Dive

### HLD: The Flipkart Flavor

Flipkart HLD questions almost always have an **India e-commerce twist**. Generic
answers that work at Google/Meta won't cut it. You need to show awareness of:

- **Big Billion Days (BBD):** 100x traffic spikes in minutes
- **Cash on Delivery (COD):** 50-60% of orders are COD — impacts payment flow
- **Inventory across warehouses:** Flipkart has 50+ warehouses pan-India
- **Pincode serviceability:** Not all products ship to all pincodes
- **Regional language support:** Hindi, Tamil, Telugu, Bengali — search and UI
- **Tier-2/3 network quality:** Intermittent connectivity, low bandwidth

### Estimation Benchmarks (Flipkart Scale)

Use these numbers in your estimation step. See [[07_interview_framework/estimation_cheat_sheet]].

| Metric | Normal Day | BBD Peak |
|--------|-----------|----------|
| DAU | 30-50M | 100-150M |
| Orders/day | 1-2M | 10-15M |
| Search queries/sec | 50K | 500K+ |
| API calls/sec | 200K | 2M+ |
| Cart additions/sec | 10K | 200K+ |
| Payment transactions/sec | 1K | 20K+ |

> **See:** [[08_reference/latency_numbers]] for latency benchmarks

### Common HLD Questions at Flipkart

1. Design Flipkart's search system
2. Design the Big Billion Days flash sale
3. Design the cart and checkout flow
4. Design inventory management for multi-warehouse
5. Design the order tracking system
6. Design a coupon/discount engine
7. Design Flipkart's notification system
8. Design the product catalog
9. Design the review and rating system
10. Design the seller onboarding platform

---

## 5. LLD Round Details

### Format

- **Duration:** 45-60 minutes
- **Language:** Java (mandatory)
- **Style:** Whiteboard class diagrams + verbal code walkthrough (sometimes live coding)
- **Unique to Flipkart:** They WILL ask you to explain SOLID principles with examples

### The SOLID Interrogation

At some point during the LLD round, the interviewer will ask:

> "Can you explain the SOLID principles? Give me an example of each."

This is not optional. This is not a "nice to have." **They will explicitly ask this.**

Prepare crisp, 30-second explanations with code examples:

```java
// S — Single Responsibility
// BAD: Order class handles pricing, persistence, and notification
// GOOD: OrderService, PricingService, NotificationService — each does one thing

// O — Open/Closed
// BAD: if (type == "FLAT") { ... } else if (type == "PERCENTAGE") { ... }
// GOOD: interface DiscountStrategy { double apply(double price); }
//       class FlatDiscount implements DiscountStrategy { ... }
//       class PercentageDiscount implements DiscountStrategy { ... }

// L — Liskov Substitution
// BAD: Square extends Rectangle but breaks setWidth/setHeight contract
// GOOD: Both implement Shape interface independently

// I — Interface Segregation
// BAD: interface Worker { void code(); void manage(); void test(); }
// GOOD: interface Coder { void code(); }
//       interface Manager { void manage(); }

// D — Dependency Inversion
// BAD: class OrderService { private MySQLRepo repo = new MySQLRepo(); }
// GOOD: class OrderService { private final Repository repo; // injected }
```

> **Deep dive:** [[11_lld/solid_with_refactoring]]

### Design Patterns They Love

Flipkart interviewers have a strong preference for these patterns:

| Pattern | Where They Expect It | Example |
|---------|---------------------|---------|
| **Strategy** | Pricing, allocation, sorting | `PricingStrategy` for different discount types |
| **Observer** | Notifications, event propagation | `OrderObserver` notifies inventory, shipping, user |
| **Factory** | Object creation | `VehicleFactory`, `PaymentFactory` |
| **Builder** | Complex object construction | `Order.builder().item(x).coupon(y).build()` |
| **Singleton** | Configuration, connection pools | `DatabaseConnectionPool.getInstance()` |
| **State** | Order lifecycle, vending machine | `OrderState`: PLACED → CONFIRMED → SHIPPED → DELIVERED |
| **Command** | Undo operations, task queuing | `Command` pattern for shopping cart operations |

### LLD Code Structure They Expect

```
src/
├── models/          # Pure data classes / entities
│   ├── User.java
│   ├── Product.java
│   └── Order.java
├── enums/           # Enumerations
│   ├── OrderStatus.java
│   └── PaymentMode.java
├── strategy/        # Strategy pattern implementations
│   ├── PricingStrategy.java
│   └── FlatDiscountStrategy.java
├── service/         # Business logic
│   ├── OrderService.java
│   └── InventoryService.java
├── repository/      # Data access (interface + impl)
│   ├── OrderRepository.java
│   └── InMemoryOrderRepository.java
├── factory/         # Factory classes
│   └── PaymentFactory.java
├── observer/        # Observer pattern
│   ├── OrderObserver.java
│   └── InventoryObserver.java
└── Main.java        # Driver class
```

---

## 6. Top 10 Most-Asked Questions

### Question 1: Design Flipkart Search

**Round:** HLD | **Frequency:** Very High | **Level:** SDE-2+

> **Full reference:** [[05_case_studies/design_search_autocomplete]]

Key Flipkart-specific requirements:
- **Autocomplete** with typo tolerance (users type "samsng" for "Samsung")
- **Regional language search** — Hindi, Tamil, Telugu queries
- **Personalized ranking** — show relevant products based on user history
- **Pincode filtering** — only show products deliverable to user's pincode
- **BBD boost** — promoted products during sale events

Architecture highlights:
- Elasticsearch cluster for full-text search
- Redis for autocomplete suggestions (sorted sets)
- ML-based ranking service (Learning to Rank)
- Search indexer consuming from Kafka (product catalog changes)

> **See also:** [[02_building_blocks/search_systems]]

---

### Question 2: Design Flash Sale (Big Billion Days)

**Round:** HLD | **Frequency:** Very High | **Level:** SDE-2+

> **Full reference:** [[05_case_studies/design_flash_sale]]

This is THE signature Flipkart question. BBD characteristics:
- **100x normal traffic** in the first 5 minutes
- **Limited inventory** — 1000 units, 1M users trying to buy
- **Fairness** — prevent bots, ensure real users get a chance
- **No overselling** — inventory count must be exact

Key components:
- **Virtual queue** — users enter a waiting room before the sale starts
- **Token bucket rate limiting** — [[05_case_studies/design_rate_limiter]]
- **Inventory reservation with TTL** — reserve for 10 min, release if not paid
- **Optimistic locking on inventory** — `UPDATE inventory SET count = count - 1 WHERE count > 0`
- **Pre-computed pages** — CDN-cached product pages to reduce origin load
- **Circuit breakers** on all downstream services — [[03_design_patterns/circuit_breaker]]

> **See also:** [[02_building_blocks/caching]], [[05_case_studies/design_ticketmaster]]

---

### Question 3: Design Cart + Checkout Flow

**Round:** HLD | **Frequency:** High | **Level:** SDE-2+

> **Full reference:** [[10_hld/examples/hld_ecommerce]]

Flipkart-specific considerations:
- **Cart persistence** — cart survives across devices (logged-in) and sessions
- **Price changes** — product price may change between add-to-cart and checkout
- **Inventory check at checkout** — item may go out of stock
- **COD eligibility** — not all orders qualify for Cash on Delivery
- **Coupon application** — stack multiple coupons with priority rules
- **Address + pincode validation** — serviceability check

Data flow:
```
Add to Cart → Price Validation → Coupon Application → Address Selection
    → Serviceability Check → Payment Selection → Order Creation
    → Inventory Deduction → Payment Processing → Order Confirmation
```

---

### Question 4: Design Inventory Management System

**Round:** HLD | **Frequency:** High | **Level:** SDE-2+

Key challenges:
- **Multi-warehouse inventory** — same SKU exists in 50+ warehouses
- **Real-time stock updates** — seller uploads, order deductions, returns
- **Warehouse selection** — nearest warehouse to buyer's pincode
- **Reserved vs available** — items in cart are "soft reserved"
- **Bulk updates during sales** — seller may add 100K units before BBD

Components:
- **Inventory Service** — CRUD on stock levels per (SKU, warehouse)
- **Reservation Service** — soft lock with TTL (cart reservation)
- **Warehouse Routing** — pincode → nearest warehouse with stock
- **Event Bus (Kafka)** — order placed → deduct stock, return initiated → add stock

> **See also:** [[02_building_blocks/message_queues]]

---

### Question 5: Design Coupon/Discount Engine

**Round:** HLD or LLD | **Frequency:** High | **Level:** SDE-2+

Types of discounts at Flipkart:
- **Flat discount** — Rs. 200 off
- **Percentage discount** — 10% off (with max cap)
- **Buy X Get Y** — Buy 2 shirts, get 1 free
- **Bank offers** — 10% instant discount on HDFC cards
- **Combo offers** — Buy phone + case for Rs. 500 off
- **Loyalty/SuperCoin** — redeem coins for discount

LLD approach (Strategy pattern):
```java
public interface DiscountStrategy {
    double calculateDiscount(Cart cart, Coupon coupon);
    boolean isApplicable(Cart cart, Coupon coupon);
}

public class FlatDiscountStrategy implements DiscountStrategy {
    @Override
    public double calculateDiscount(Cart cart, Coupon coupon) {
        return coupon.getValue();
    }

    @Override
    public boolean isApplicable(Cart cart, Coupon coupon) {
        return cart.getTotal() >= coupon.getMinOrderValue();
    }
}

public class PercentageDiscountStrategy implements DiscountStrategy {
    @Override
    public double calculateDiscount(Cart cart, Coupon coupon) {
        double discount = cart.getTotal() * coupon.getPercentage() / 100.0;
        return Math.min(discount, coupon.getMaxDiscount());
    }

    @Override
    public boolean isApplicable(Cart cart, Coupon coupon) {
        return cart.getTotal() >= coupon.getMinOrderValue();
    }
}

public class CouponEngine {
    private final Map<CouponType, DiscountStrategy> strategies;

    public CouponEngine() {
        strategies = new HashMap<>();
        strategies.put(CouponType.FLAT, new FlatDiscountStrategy());
        strategies.put(CouponType.PERCENTAGE, new PercentageDiscountStrategy());
        // Easy to add new types — Open/Closed principle
    }

    public double apply(Cart cart, Coupon coupon) {
        DiscountStrategy strategy = strategies.get(coupon.getType());
        if (strategy != null && strategy.isApplicable(cart, coupon)) {
            return strategy.calculateDiscount(cart, coupon);
        }
        return 0;
    }
}
```

---

### Question 6: Design Order Tracking System

**Round:** HLD | **Frequency:** High | **Level:** SDE-2+

> **Reference:** [[05_case_studies/design_notification_system]]

Order lifecycle at Flipkart:
```
PLACED → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                                  ↘ RETURNED → REFUND_INITIATED → REFUNDED
```

Key components:
- **Order State Machine** — enforces valid transitions
- **Event sourcing** — every state change is an immutable event
- **Push notifications** — SMS, email, app push on each transition
- **Real-time tracking** — delivery agent GPS location updates
- **ETA computation** — ML model predicting delivery time

Architecture:
- Kafka for event streaming (order events)
- Elasticsearch for order search (by user, by status, by date range)
- Redis for real-time delivery agent location
- Notification service consuming order events

---

### Question 7: Design Parking Lot (LLD)

**Round:** Machine Coding / LLD | **Frequency:** Very High | **Level:** All

> **Full reference:** [[11_lld/examples/lld_parking_lot]]

The single most asked LLD question at Flipkart. See the full walkthrough in
Section 8 below.

---

### Question 8: Design Snake and Ladder (LLD)

**Round:** Machine Coding | **Frequency:** High | **Level:** SDE-1, SDE-2

Key entities: `Board`, `Player`, `Dice`, `Snake`, `Ladder`, `Cell`

Design considerations:
- Board is configurable (snakes and ladders positions)
- Multiple players, turn-based
- Dice can be configurable (1 die, 2 dice, loaded dice)
- Win condition: reach exactly cell 100
- Extension: special cells (power-ups, skip turn)

```java
public class Game {
    private final Board board;
    private final Queue<Player> players;
    private final Dice dice;

    public void play() {
        while (!isGameOver()) {
            Player current = players.poll();
            int roll = dice.roll();
            int newPosition = current.getPosition() + roll;

            if (newPosition <= board.getSize()) {
                newPosition = board.getFinalPosition(newPosition); // apply snake/ladder
                current.setPosition(newPosition);
            }

            if (newPosition == board.getSize()) {
                System.out.println(current.getName() + " wins!");
                return;
            }
            players.offer(current);
        }
    }
}

public class Board {
    private final int size;
    private final Map<Integer, Integer> snakes;   // head → tail
    private final Map<Integer, Integer> ladders;  // bottom → top

    public int getFinalPosition(int position) {
        if (snakes.containsKey(position)) return snakes.get(position);
        if (ladders.containsKey(position)) return ladders.get(position);
        return position;
    }
}
```

---

### Question 9: Design Splitwise (LLD)

**Round:** Machine Coding / LLD | **Frequency:** High | **Level:** SDE-1, SDE-2

> **Reference:** [[11_lld/examples/lld_splitwise]]

Key features:
- Add expense (equal split, exact split, percentage split)
- Show balances per user
- Simplify debts (minimize transactions)
- Group expenses

Strategy pattern for split types:
```java
public interface SplitStrategy {
    Map<User, Double> split(double amount, List<User> participants, Map<User, Double> extras);
}

public class EqualSplitStrategy implements SplitStrategy {
    @Override
    public Map<User, Double> split(double amount, List<User> participants,
                                    Map<User, Double> extras) {
        double perHead = amount / participants.size();
        Map<User, Double> shares = new HashMap<>();
        for (User u : participants) {
            shares.put(u, perHead);
        }
        return shares;
    }
}
```

---

### Question 10: Design Notification System

**Round:** HLD | **Frequency:** High | **Level:** SDE-2+

> **Full reference:** [[05_case_studies/design_notification_system]]

Flipkart-specific:
- **Multi-channel:** Push, SMS, Email, WhatsApp
- **Priority levels:** OTP (critical) > order update (high) > promotional (low)
- **Rate limiting per user:** Don't spam users — [[05_case_studies/design_rate_limiter]]
- **Template engine:** Dynamic content with user/order variables
- **Regional language support:** Notifications in user's preferred language
- **DND hours:** Don't send promotional notifications between 9 PM - 9 AM

---

## 7. Flipkart-Specific Patterns

### Pattern 1: Cash on Delivery (COD)

50-60% of Flipkart orders are COD. This fundamentally changes system design:

- **No upfront payment verification** — order is placed on trust
- **Higher return rates** — COD orders have 2-3x return rate vs prepaid
- **Cash collection logistics** — delivery agent must collect cash, deposit daily
- **COD eligibility rules** — new users, high-value items, certain pincodes may not qualify
- **Reconciliation complexity** — matching cash collected with orders delivered

In any payment/checkout design, you MUST mention COD handling.

### Pattern 2: India-Scale Traffic Spikes (BBD)

Big Billion Days creates traffic patterns unlike anything in Western e-commerce:

```
Normal day:  ████████████████  (baseline)
BBD Day 1:   ████████████████████████████████████████████████████████████████
             ↑ 100x spike at midnight when sale starts
```

Design implications:
- **Auto-scaling is not enough** — you need pre-provisioned capacity
- **Virtual waiting rooms** — queue users before letting them in
- **Circuit breakers everywhere** — [[03_design_patterns/circuit_breaker]]
- **Graceful degradation** — turn off recommendations, personalization under load
- **Pre-warmed caches** — [[02_building_blocks/caching]]
- **Database read replicas** — separate read/write paths

### Pattern 3: Tier-2/3 City Network Quality

40%+ of Flipkart users are in tier-2 and tier-3 cities with:
- **2G/3G connections** — high latency, low bandwidth
- **Intermittent connectivity** — requests may timeout frequently
- **Low-end devices** — limited memory and processing power

Design implications:
- **Aggressive caching** on client side
- **Smaller payloads** — compressed JSON, no unnecessary fields
- **Offline-first patterns** — queue actions locally, sync when connected
- **Progressive loading** — show skeleton UI, load images lazily
- **Retry with exponential backoff** — handle transient network failures

### Pattern 4: Regional Language Support

Flipkart supports 11+ Indian languages. Impact on system design:
- **Search must handle transliteration** — "mobile" typed in Hindi script
- **Product descriptions** — multi-language content storage
- **Notifications** — user's preferred language
- **Voice search** — increasingly important in tier-2/3 cities

### Pattern 5: Pincode-Based Serviceability

Not all products are deliverable to all pincodes:
- **Serviceability matrix** — (seller_warehouse, pincode) → deliverable? days?
- **Pre-computed and cached** — checked at search time, not just checkout
- **Impacts search ranking** — non-deliverable products should rank lower
- **Dynamic during sales** — some routes may be paused during peak logistics load

### Pattern 6: Aadhaar / KYC for High-Value Transactions

Government regulations require identity verification for certain transactions:
- **PhonePe KYC** for payments
- **High-value electronics** — GST invoice requires PAN/Aadhaar
- **Seller verification** — mandatory KYC for marketplace sellers

### Pattern 7: Flipkart's Microservices Migration

Flipkart's migration from monolith to microservices (2014-2016) is a well-known
case study. If asked about architecture evolution:

- **Monolith era (2007-2013):** Single Java application, single MySQL DB
- **First split:** Separated catalog, order, and user services
- **Service mesh:** Introduced internal service discovery and routing
- **Event-driven:** Kafka backbone connecting all services
- **Current state:** 500+ microservices, FCP (Flipkart Cloud Platform)

> **Reference for patterns:** [[03_design_patterns/sharding]], [[01_fundamentals/acid_vs_base]]

---

## 8. Sample Walkthrough: Machine Coding — Parking Lot in 90 Minutes

> **Full reference:** [[11_lld/examples/lld_parking_lot]]

This is the most commonly asked machine coding problem at Flipkart. Here is
exactly how you should approach it in 90 minutes.

### The Problem Statement (as given)

> Design a parking lot system. The parking lot has multiple floors. Each floor
> has multiple spots of different sizes (small, medium, large). Vehicles can be
> cars, bikes, or trucks. A bike fits in a small spot, a car in a medium spot,
> a truck in a large spot. Implement: park a vehicle, unpark a vehicle, check
> availability, calculate fee based on hours parked.

### Minutes 0-10: Clarify & Identify Entities

Ask the interviewer:
- "Can a car park in a large spot if medium is full?" → Usually yes
- "Is pricing per hour or per day?" → Per hour
- "Multiple entry/exit points?" → Keep single for now
- "Concurrent access?" → Mention it, but don't implement threading

Entities identified:
- `Vehicle` (abstract), `Car`, `Bike`, `Truck`
- `ParkingSpot`, `ParkingFloor`, `ParkingLot`
- `Ticket`, `PricingStrategy`

### Minutes 10-20: Quick Class Diagram

```
Vehicle (abstract) ← Car, Bike, Truck
ParkingSpot: id, floor, type, vehicle, isOccupied
ParkingFloor: id, List<ParkingSpot>
ParkingLot: List<ParkingFloor>, park(), unpark()
Ticket: id, vehicle, spot, entryTime
PricingStrategy (interface) ← HourlyPricingStrategy
```

### Minutes 20-65: Code

```java
// === Enums ===
public enum VehicleType {
    BIKE, CAR, TRUCK
}

public enum SpotType {
    SMALL, MEDIUM, LARGE
}

// === Models ===
public abstract class Vehicle {
    private final String registrationNumber;
    private final VehicleType type;

    public Vehicle(String registrationNumber, VehicleType type) {
        this.registrationNumber = registrationNumber;
        this.type = type;
    }

    public String getRegistrationNumber() { return registrationNumber; }
    public VehicleType getType() { return type; }
}

public class Car extends Vehicle {
    public Car(String regNo) { super(regNo, VehicleType.CAR); }
}

public class Bike extends Vehicle {
    public Bike(String regNo) { super(regNo, VehicleType.BIKE); }
}

public class Truck extends Vehicle {
    public Truck(String regNo) { super(regNo, VehicleType.TRUCK); }
}

// === Parking Spot ===
public class ParkingSpot {
    private final String id;
    private final SpotType type;
    private final int floor;
    private Vehicle parkedVehicle;

    public ParkingSpot(String id, SpotType type, int floor) {
        this.id = id;
        this.type = type;
        this.floor = floor;
    }

    public boolean isAvailable() { return parkedVehicle == null; }

    public boolean canFit(VehicleType vehicleType) {
        if (!isAvailable()) return false;
        return type.ordinal() >= vehicleType.ordinal();
        // SMALL(0)>=BIKE(0), MEDIUM(1)>=CAR(1), LARGE(2)>=TRUCK(2)
    }

    public void occupy(Vehicle vehicle) { this.parkedVehicle = vehicle; }
    public void vacate() { this.parkedVehicle = null; }

    // getters...
    public String getId() { return id; }
    public SpotType getType() { return type; }
    public int getFloor() { return floor; }
    public Vehicle getParkedVehicle() { return parkedVehicle; }
}

// === Ticket ===
public class Ticket {
    private final String id;
    private final Vehicle vehicle;
    private final ParkingSpot spot;
    private final LocalDateTime entryTime;

    public Ticket(String id, Vehicle vehicle, ParkingSpot spot) {
        this.id = id;
        this.vehicle = vehicle;
        this.spot = spot;
        this.entryTime = LocalDateTime.now();
    }

    // getters...
    public String getId() { return id; }
    public Vehicle getVehicle() { return vehicle; }
    public ParkingSpot getSpot() { return spot; }
    public LocalDateTime getEntryTime() { return entryTime; }
}

// === Pricing Strategy (Strategy Pattern) ===
public interface PricingStrategy {
    double calculate(Ticket ticket, LocalDateTime exitTime);
}

public class HourlyPricingStrategy implements PricingStrategy {
    private final Map<VehicleType, Double> ratePerHour;

    public HourlyPricingStrategy() {
        ratePerHour = new HashMap<>();
        ratePerHour.put(VehicleType.BIKE, 10.0);
        ratePerHour.put(VehicleType.CAR, 20.0);
        ratePerHour.put(VehicleType.TRUCK, 40.0);
    }

    @Override
    public double calculate(Ticket ticket, LocalDateTime exitTime) {
        long hours = ChronoUnit.HOURS.between(ticket.getEntryTime(), exitTime);
        hours = Math.max(1, hours); // minimum 1 hour
        double rate = ratePerHour.get(ticket.getVehicle().getType());
        return hours * rate;
    }
}

// === Spot Allocation Strategy (Strategy Pattern) ===
public interface SpotAllocationStrategy {
    ParkingSpot findSpot(List<ParkingSpot> spots, VehicleType vehicleType);
}

public class NearestFirstStrategy implements SpotAllocationStrategy {
    @Override
    public ParkingSpot findSpot(List<ParkingSpot> spots, VehicleType vehicleType) {
        return spots.stream()
            .filter(spot -> spot.canFit(vehicleType))
            .findFirst()
            .orElse(null);
    }
}

// === Parking Lot (Main Service) ===
public class ParkingLot {
    private final List<ParkingSpot> spots;
    private final Map<String, Ticket> activeTickets; // ticketId → Ticket
    private final PricingStrategy pricingStrategy;
    private final SpotAllocationStrategy allocationStrategy;
    private int ticketCounter = 0;

    public ParkingLot(List<ParkingSpot> spots,
                      PricingStrategy pricingStrategy,
                      SpotAllocationStrategy allocationStrategy) {
        this.spots = spots;
        this.activeTickets = new HashMap<>();
        this.pricingStrategy = pricingStrategy;
        this.allocationStrategy = allocationStrategy;
    }

    public Ticket park(Vehicle vehicle) {
        ParkingSpot spot = allocationStrategy.findSpot(spots, vehicle.getType());
        if (spot == null) {
            System.out.println("No spot available for " + vehicle.getType());
            return null;
        }
        spot.occupy(vehicle);
        String ticketId = "T-" + (++ticketCounter);
        Ticket ticket = new Ticket(ticketId, vehicle, spot);
        activeTickets.put(ticketId, ticket);
        System.out.println("Parked " + vehicle.getRegistrationNumber()
            + " at spot " + spot.getId() + " | Ticket: " + ticketId);
        return ticket;
    }

    public double unpark(String ticketId) {
        Ticket ticket = activeTickets.remove(ticketId);
        if (ticket == null) {
            System.out.println("Invalid ticket: " + ticketId);
            return -1;
        }
        ticket.getSpot().vacate();
        double fee = pricingStrategy.calculate(ticket, LocalDateTime.now());
        System.out.println("Unparked " + ticket.getVehicle().getRegistrationNumber()
            + " | Fee: Rs. " + fee);
        return fee;
    }

    public void showAvailability() {
        Map<SpotType, Long> available = spots.stream()
            .filter(ParkingSpot::isAvailable)
            .collect(Collectors.groupingBy(ParkingSpot::getType, Collectors.counting()));
        System.out.println("Available spots: " + available);
    }
}
```

### Minutes 65-80: Main Method

```java
public class Main {
    public static void main(String[] args) {
        // Setup parking lot: 2 floors, mixed spots
        List<ParkingSpot> spots = new ArrayList<>();
        spots.add(new ParkingSpot("F1-S1", SpotType.SMALL, 1));
        spots.add(new ParkingSpot("F1-S2", SpotType.SMALL, 1));
        spots.add(new ParkingSpot("F1-M1", SpotType.MEDIUM, 1));
        spots.add(new ParkingSpot("F1-M2", SpotType.MEDIUM, 1));
        spots.add(new ParkingSpot("F1-L1", SpotType.LARGE, 1));
        spots.add(new ParkingSpot("F2-S1", SpotType.SMALL, 2));
        spots.add(new ParkingSpot("F2-M1", SpotType.MEDIUM, 2));
        spots.add(new ParkingSpot("F2-L1", SpotType.LARGE, 2));

        ParkingLot lot = new ParkingLot(
            spots,
            new HourlyPricingStrategy(),
            new NearestFirstStrategy()
        );

        // Demo
        lot.showAvailability();

        Ticket t1 = lot.park(new Car("KA-01-1234"));
        Ticket t2 = lot.park(new Bike("KA-01-5678"));
        Ticket t3 = lot.park(new Truck("KA-01-9999"));

        lot.showAvailability();

        lot.unpark(t1.getId());
        lot.unpark(t2.getId());

        lot.showAvailability();
    }
}
```

### Minutes 80-90: Refactor & Polish

- Ensure all classes have proper access modifiers
- Add any missing getters
- Verify the code compiles (mentally or with IDE)
- Add brief comments on design decisions if time allows
- Mention to the interviewer: "I could add a Factory for vehicles and a
  FlatRatePricingStrategy as extensions without modifying existing code"

### What This Walkthrough Demonstrates

| Criteria | How It's Met |
|----------|-------------|
| Working code | `main()` runs end-to-end |
| SOLID — SRP | Pricing logic separate from ParkingLot |
| SOLID — OCP | New PricingStrategy without changing ParkingLot |
| SOLID — DIP | ParkingLot depends on interfaces, not concrete classes |
| Strategy pattern | PricingStrategy, SpotAllocationStrategy |
| Clean code | Meaningful names, small methods, no God class |
| Extensibility | Easy to add new vehicle types, pricing models, allocation strategies |

---

## 9. Red Flags & Green Flags

### Red Flags (Things That Sink Candidates)

| Red Flag | Why It Kills You |
|----------|-----------------|
| Writing pseudocode in machine coding | They want REAL Java code that compiles |
| Not knowing SOLID principles | They explicitly test for this — no exceptions |
| Using Python/JS in the coding round | Java is mandatory at Flipkart |
| Ignoring India-specific requirements | COD, pincodes, BBD — they expect you to know |
| Monolithic class design in LLD | God classes are an instant red flag |
| Not asking clarifying questions | Shows lack of structured thinking |
| Over-engineering in 90 minutes | Using 8 design patterns when 2 would suffice |
| No main() method / demo | They want to see the code RUN |
| Ignoring scale in HLD | Flipkart is 400M users, not a startup |
| Hardcoding values instead of using enums | Shows poor coding practices |

### Green Flags (Things That Impress Interviewers)

| Green Flag | Why It Impresses |
|------------|-----------------|
| Clean package/class structure from the start | Shows you think before coding |
| Proactively mentioning trade-offs | "I chose Strategy over inheritance because..." |
| Mentioning BBD-specific patterns unprompted | Shows domain awareness |
| Using Builder pattern for complex objects | Flipkart engineers love Builder |
| Writing unit-testable code (DI, interfaces) | Shows production-quality thinking |
| Handling edge cases in machine coding | Null checks, boundary conditions |
| Mentioning COD in payment flows | Shows you understand Indian e-commerce |
| Explaining why you chose MySQL vs NoSQL | Reasoned database selection |
| Drawing clean, labeled architecture diagrams | Visual clarity matters |
| Finishing machine coding with time to spare | Shows speed + quality |

---

## 10. Preparation Checklist

### 4 Weeks Before Interview

- [ ] **Java fundamentals refresh** — Collections, Streams, Generics, Enums
- [ ] **SOLID principles** — memorize with examples → [[11_lld/solid_with_refactoring]]
- [ ] **Design patterns** — implement Strategy, Observer, Factory, Builder, State from scratch
- [ ] **Practice machine coding** — solve 2 problems per week under 90-minute timer
- [ ] **Read Flipkart tech blog** — https://tech.flipkart.com/ (architecture posts)

### 2 Weeks Before Interview

- [ ] **Solve all 10 machine coding problems** listed in Section 3 (in Java, timed)
- [ ] **Practice HLD** — at least 5 problems using [[07_interview_framework/the_four_step_framework]]
- [ ] **Flash sale design** — nail this cold → [[05_case_studies/design_flash_sale]]
- [ ] **Cart + checkout** — end-to-end flow → [[10_hld/examples/hld_ecommerce]]
- [ ] **Understand India-scale numbers** — DAU, orders/sec, BBD spikes
- [ ] **Study:** [[08_reference/latency_numbers]], [[07_interview_framework/estimation_cheat_sheet]]

### 1 Week Before Interview

- [ ] **Mock machine coding round** — have a friend give you a problem, 90-min timer
- [ ] **Mock HLD round** — practice talking through a design for 45 minutes
- [ ] **Prepare SOLID explanation** — crisp 30-second example for each principle
- [ ] **Review all design patterns** with Java code snippets ready in your head
- [ ] **Prepare your IDE** — IntelliJ or Eclipse, Java 17, create a blank project template

### Day Before Interview

- [ ] **Parking Lot** — re-solve from scratch in 60 minutes (warm-up)
- [ ] **Prepare your laptop** — IDE working, no updates pending, charger packed
- [ ] **Sleep well** — 90 minutes of live coding requires peak mental energy

### During the Interview

- [ ] **First 2 minutes:** Restate the problem, ask 3-4 clarifying questions
- [ ] **Announce your approach:** "I'll use Strategy pattern for pricing"
- [ ] **Code entities first:** Models and enums before services
- [ ] **Talk while you code:** Explain your design decisions out loud
- [ ] **Run main() before time:** Working code > perfect code
- [ ] **Mention extensions:** "If we wanted to add X, we could add a new Y implementation"

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│              FLIPKART INTERVIEW AT A GLANCE          │
├─────────────────────────────────────────────────────┤
│ Language:        Java (MANDATORY)                    │
│ Gatekeeper:      Machine Coding (90 min)            │
│ Key principle:   SOLID (they WILL ask)              │
│ Key patterns:    Strategy, Observer, Factory, Builder│
│ Domain focus:    E-commerce, India-scale             │
│ Signature Q:     BBD Flash Sale, Parking Lot         │
│ India-specific:  COD, pincodes, regional languages   │
│ Scale:           400M users, 100x BBD spike          │
│ Tech stack:      Java + Spring Boot + Kafka + Redis  │
│ Parent company:  Walmart                             │
├─────────────────────────────────────────────────────┤
│ Remember: Working code that compiles > elegant       │
│ pseudocode that doesn't.                             │
└─────────────────────────────────────────────────────┘
```

---

## Related Resources

| Resource | Link |
|----------|------|
| Four-Step Framework | [[07_interview_framework/the_four_step_framework]] |
| Estimation Cheat Sheet | [[07_interview_framework/estimation_cheat_sheet]] |
| Latency Numbers | [[08_reference/latency_numbers]] |
| E-commerce HLD | [[10_hld/examples/hld_ecommerce]] |
| E-commerce HLD-LLD Bridge | [[12_hld_lld_bridge/zoom_ecommerce]] |
| Parking Lot LLD | [[11_lld/examples/lld_parking_lot]] |
| SOLID Principles | [[11_lld/solid_with_refactoring]] |
| Flash Sale Case Study | [[05_case_studies/design_flash_sale]] |
| Search Autocomplete | [[05_case_studies/design_search_autocomplete]] |
| Notification System | [[05_case_studies/design_notification_system]] |
| Rate Limiter | [[05_case_studies/design_rate_limiter]] |
| Distributed Cache | [[05_case_studies/design_distributed_cache]] |
| Circuit Breaker | [[03_design_patterns/circuit_breaker]] |
| Sharding | [[03_design_patterns/sharding]] |
| Caching | [[02_building_blocks/caching]] |
| Message Queues | [[02_building_blocks/message_queues]] |
| Booking System HLD | [[10_hld/examples/hld_booking_system]] |
| Ticketmaster Case Study | [[05_case_studies/design_ticketmaster]] |
| Company Guides Index | [[17_company_interview_guide/index]] |

---

> **Back to:** [[17_company_interview_guide/index]]
