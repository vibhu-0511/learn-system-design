# Stripe — System Design Interview Guide

> **"Increase the GDP of the internet."**
> Stripe is NOT a typical tech company. It is an infrastructure company that happens to write software.
> If you prepare for Stripe like you prepare for Google or Meta, you will fail.

---

**Navigation:** [[17_company_interview_guide/index]] | [[07_interview_framework/the_four_step_framework]]

---

## Table of Contents

1. [Company Overview](#company-overview)
2. [Interview Process](#interview-process)
3. [System Design Round Details](#system-design-round-details)
4. [Bug Bash Round](#bug-bash-round)
5. [Integration Round](#integration-round)
6. [Top 10 Most-Asked Questions](#top-10-most-asked-questions)
7. [Stripe-Specific Patterns](#stripe-specific-patterns)
8. [Sample Walkthrough — Design a Payment Processing System](#sample-walkthrough--design-a-payment-processing-system)
9. [Red Flags and Green Flags](#red-flags-and-green-flags)
10. [Preparation Checklist](#preparation-checklist)

---

## Company Overview

### What Makes Stripe Different

Stripe is fundamentally unlike FAANG companies in almost every dimension that matters for
interview preparation:

| Dimension | FAANG | Stripe |
|---|---|---|
| Core product | Consumer apps, ads, cloud | Financial infrastructure / APIs |
| Primary user | End consumers | Developers and businesses |
| Interview focus | DSA + system design | Bug bash + integration + system design |
| Code quality bar | "Does it pass tests?" | "Is this production-quality code?" |
| Design emphasis | Scale and availability | Correctness, idempotency, money safety |
| Culture | Varies | Deep culture of writing (memos, RFCs) |
| API philosophy | Internal-first | API-is-the-product |

### Mission

Stripe's mission is to **increase the GDP of the internet**. This is not marketing fluff — it
drives every technical decision. When you design systems at Stripe, you are designing systems
that move real money for millions of businesses. A bug does not mean a bad user experience.
A bug means someone loses money, or a business cannot accept payments, or a regulatory
violation occurs.

### Tech Stack

| Layer | Technology |
|---|---|
| Backend (legacy) | Ruby (Stripe started as a Ruby shop) |
| Backend (modern) | Java, Go |
| Frontend | React, TypeScript |
| Data | Apache Kafka, Apache Spark, Presto |
| Infrastructure | AWS (primary), bare metal for some workloads |
| Databases | MongoDB (legacy), PostgreSQL, custom sharded stores |
| API Gateway | Custom-built (not off-the-shelf) |
| Messaging | Kafka, custom queue systems |

### Levels and Compensation

Stripe uses a leveling system from L1 to L5+ (IC track):

| Level | Title | India (Total Comp INR/yr) | US (Total Comp USD/yr) |
|---|---|---|---|
| L1 | New Grad Engineer | 35-50L | $180K-$220K |
| L2 | Software Engineer | 50-80L | $250K-$350K |
| L3 | Senior Engineer | 80-1.2Cr | $350K-$500K |
| L4 | Staff Engineer | 1.2-2Cr | $500K-$700K |
| L5 | Principal Engineer | 2Cr+ | $700K+ |

> **Note:** Stripe RSUs vest over 4 years with a 1-year cliff. Stripe went through a down-round
> in 2023 but has since recovered significantly. As of 2025, Stripe RSUs are liquid-tradable
> on secondary markets and the company has indicated plans for a potential IPO or direct listing.

### Culture of Writing

Stripe has one of the strongest writing cultures in tech:

- **Design documents** are the primary mechanism for decision-making, not meetings
- Engineers are expected to write clearly and precisely
- Interview feedback is written in long-form prose, not checklists
- The ability to articulate trade-offs in writing is valued as highly as coding ability
- Patrick Collison (CEO) personally reviews writing quality in hiring decisions at senior levels

### Stripe Offices and Remote Policy

- **US:** San Francisco (HQ), Seattle, New York, South San Francisco
- **India:** Bangalore (large and growing engineering center)
- **Remote:** Stripe was early to embrace remote work; many roles are remote-eligible
- **Ireland:** Dublin (EMEA HQ, strong engineering presence)

---

## Interview Process

### How Stripe's Process Differs from FAANG

This is critical to understand. Stripe does NOT follow the standard FAANG interview loop.

| Round | FAANG Equivalent | Stripe Equivalent |
|---|---|---|
| Online Assessment | LeetCode-style | None (Stripe does not do OAs) |
| Phone Screen | DSA coding | Exploratory chat + light technical |
| Coding Round 1 | DSA Medium/Hard | **Bug Bash** (debugging a real codebase) |
| Coding Round 2 | DSA Medium/Hard | **Integration** (build with Stripe's API) |
| System Design | Generic distributed systems | **Payments-focused** system design |
| Behavioral | STAR method | **Team Match** (values + collaboration) |

### Full Interview Timeline

```
Week 0:  Recruiter Screen (30 min)
         - Why Stripe? Why now?
         - Role fit, level calibration
         - Logistics (visa, location, comp expectations)

Week 1:  Technical Phone Screen (60 min)
         - One of: Bug Bash OR Integration (varies by role)
         - Sometimes a short system design discussion
         - This is a FILTER round — ~50% pass rate

Week 2-3: On-site (Virtual or In-Person) — 4 rounds, one day
         Round 1: Bug Bash (60 min)
         Round 2: Integration (60 min)
         Round 3: System Design (60 min)
         Round 4: Team Match / Manager Chat (45-60 min)

Week 3-4: Hiring Committee Decision
         - Stripe's HC is thorough; expect detailed written feedback
         - Calibration across all four signals

Week 4-5: Offer / Team Matching
         - If HC approves, you enter team matching
         - You may speak with 2-3 teams before choosing
```

### What Stripe Looks For (The Four Signals)

1. **Technical Rigor** — Can you reason about correctness, edge cases, failure modes?
2. **Pragmatism** — Do you make reasonable trade-offs, or do you over-engineer?
3. **Communication** — Can you explain your thinking clearly, especially in writing?
4. **Collaboration** — Do you take feedback well? Can you build on others' ideas?

> Stripe explicitly does NOT optimize for "algorithm puzzle-solving ability."
> They care about whether you can build and maintain production systems.

---

## System Design Round Details

### What Makes Stripe's System Design Different

The system design round at Stripe is unlike what you would encounter at Google, Meta, or Amazon.
Here is why:

#### 1. Payments Domain Knowledge Matters

You do not need to be a payments expert, but you should understand:

- What a payment intent, charge, and refund are
- The difference between authorization and capture
- What a payment gateway and payment processor do
- Why PCI-DSS compliance matters
- How card networks (Visa, Mastercard) work at a high level

#### 2. API Design is Front and Center

At most companies, API design is a small part of the system design round. At Stripe, it can
be the MAJORITY of the discussion. Stripe's product IS its API. Interviewers will probe:

- REST endpoint design (naming, versioning, error handling)
- Request/response schemas with strong typing
- Idempotency key design
- Pagination strategy
- Webhook payload design

See: [[01_fundamentals/api_design]]

#### 3. Consistency Over Availability

Most system design prep teaches you to favor availability (AP systems). At Stripe, the
default is the opposite:

| Principle | FAANG Default | Stripe Default |
|---|---|---|
| CAP preference | AP (Available + Partition-tolerant) | CP (Consistent + Partition-tolerant) |
| Data loss tolerance | "Eventual consistency is fine" | "You CANNOT lose a transaction" |
| Failure mode | Degrade gracefully | Fail loudly, reconcile, alert |
| Duplicate handling | "At-least-once is fine" | "Exactly-once or idempotent at-least-once" |

See: [[01_fundamentals/acid_vs_base]]

#### 4. Financial Correctness is Non-Negotiable

In a system design at Google, if you say "we can tolerate some data loss," that might be
acceptable for a social media feed. At Stripe, if you say that about a payment system,
the interview is effectively over.

Key principles:
- **Every cent must be accounted for** — double-entry bookkeeping
- **Idempotency everywhere** — retries must never double-charge
- **Reconciliation** — async processes to detect and fix discrepancies
- **Audit trails** — every state change must be logged immutably

#### 5. The Interviewer is Often a Payments Expert

Stripe interviewers are often engineers who have built real payment systems. They will
push back on hand-wavy answers. Be prepared to go deep on:

- What happens when a network call to Visa times out mid-transaction?
- How do you handle partial failures in a multi-step payment flow?
- What is your reconciliation strategy?
- How do you handle currency conversion edge cases (e.g., JPY has no decimal)?

### System Design Evaluation Criteria at Stripe

| Criteria | Weight | Notes |
|---|---|---|
| API design quality | High | Clean, consistent, well-typed |
| Correctness guarantees | Very High | Idempotency, ACID, reconciliation |
| Failure handling | Very High | What happens when things go wrong? |
| Scalability | Medium | Important but secondary to correctness |
| Trade-off articulation | High | Why did you choose X over Y? |
| Domain awareness | Medium | Basic payments knowledge expected |

---

## Bug Bash Round

### What It Is

The Bug Bash is **unique to Stripe**. You will not encounter this round at any other
major tech company. Here is what happens:

1. You are given access to a **real codebase** (typically in Ruby, Python, or JavaScript)
2. The codebase has **several intentional bugs** planted in it
3. You have **60 minutes** to find and fix as many bugs as possible
4. The codebase is a simplified version of a real Stripe-like system (e.g., a billing
   service, a webhook dispatcher, an API endpoint)

### What the Bugs Look Like

The bugs are NOT trick questions. They are the kinds of bugs that occur in real production
systems:

| Bug Category | Example |
|---|---|
| Off-by-one errors | Loop iterates one too many/few times |
| Race conditions | Two threads updating the same balance |
| Null/nil handling | Missing nil check on optional field |
| Type coercion | String "100" compared with integer 100 |
| Currency math | Using floating point for money ($0.1 + $0.2 != $0.3) |
| API contract | Response missing a required field |
| Edge cases | Empty list, zero amount, negative refund |
| Logic errors | Incorrect conditional (AND vs OR) |
| State machine | Invalid state transition not caught |
| Timezone issues | UTC vs local time comparison |

### How to Prepare for Bug Bash

1. **Practice reading unfamiliar code quickly**
   - Clone open-source projects and try to understand them in 10 minutes
   - Practice in Ruby even if it is not your primary language (Stripe has a lot of Ruby)

2. **Build a mental checklist of common bug patterns**
   ```
   [ ] Null/nil checks on every optional value
   [ ] Floating point used for money? (BIG red flag)
   [ ] Off-by-one in loops and array indexing
   [ ] Race conditions in concurrent code
   [ ] Error handling — are exceptions caught and handled?
   [ ] Type mismatches (string vs int, etc.)
   [ ] Boundary conditions (empty, zero, negative, max)
   [ ] Time zone handling
   [ ] Unicode/encoding issues in strings
   ```

3. **Practice debugging without a debugger**
   - Stripe's bug bash environment may not have full IDE support
   - Get comfortable reading stack traces and reasoning about code flow

4. **Understand basic financial calculations**
   ```ruby
   # BAD — floating point for money
   total = 0.1 + 0.2  # => 0.30000000000000004

   # GOOD — use integers (cents) or BigDecimal
   total_cents = 10 + 20  # => 30
   # or
   total = BigDecimal("0.1") + BigDecimal("0.2")  # => 0.3
   ```

### Bug Bash Scoring

| Signal | What They Look For |
|---|---|
| Speed of comprehension | How quickly do you understand the codebase? |
| Systematic approach | Do you have a method, or are you randomly scanning? |
| Bug identification | How many bugs do you find? |
| Fix quality | Are your fixes correct and clean? |
| Communication | Do you explain what each bug is and why it matters? |
| Prioritization | Do you fix the critical bugs first? |

### Pro Tips for Bug Bash

- **Start with the tests.** If there are failing tests, read them first — they tell you
  what the code SHOULD do.
- **Read the README/docs first.** Understand the system before diving into code.
- **Look at the data model.** Many bugs stem from incorrect data handling.
- **Check error paths.** Happy paths are usually correct; bugs hide in error handling.
- **Talk out loud.** The interviewer wants to see your thought process.
- **Do not refactor.** This is not a code quality exercise. Fix bugs, do not rewrite.

---

## Integration Round

### What It Is

The Integration round is also **unique to Stripe**. Here is what happens:

1. You are given a **partially built application** (e.g., a simple e-commerce checkout)
2. You need to **integrate Stripe's API** (or a Stripe-like API) to complete it
3. You have **60 minutes** to get the integration working
4. You will typically work with: payment intents, charges, webhooks, or subscriptions

### What They Evaluate

This is NOT a speed test. Stripe explicitly values **code quality over completion**:

| Signal | Weight | Description |
|---|---|---|
| Code quality | Very High | Clean, readable, well-structured code |
| Error handling | Very High | Graceful handling of API failures |
| API understanding | High | Correct use of Stripe API patterns |
| Testing | Medium-High | Do you write tests? Do you think about edge cases? |
| Completion | Medium | Getting it working matters, but quality > speed |
| Communication | High | Explaining your approach and trade-offs |

### How to Prepare for Integration Round

1. **Build something with Stripe's API before the interview**
   - Sign up for a Stripe test account (free)
   - Build a simple checkout flow
   - Implement webhook handling
   - Try the subscription API

2. **Understand these Stripe API concepts cold**
   ```
   PaymentIntent   — The core object for collecting a payment
   SetupIntent     — Save a card for future use without charging
   Customer        — Represents a buyer
   Charge          — A completed payment (created from PaymentIntent)
   Refund          — Reverse a charge
   Subscription    — Recurring billing
   Invoice         — A bill sent to a customer
   Webhook         — Server-to-server event notification
   Idempotency-Key — Header to prevent duplicate operations
   ```

3. **Practice clean code under time pressure**
   - Use meaningful variable names
   - Handle errors explicitly (no bare `rescue` / `catch`)
   - Add comments explaining WHY, not WHAT
   - Structure your code in small, focused functions

4. **Know the common integration pitfalls**

   ```python
   # BAD — not handling API errors
   charge = stripe.Charge.create(amount=1000, currency="usd", source=token)

   # GOOD — proper error handling
   try:
       charge = stripe.Charge.create(
           amount=1000,
           currency="usd",
           source=token,
           idempotency_key=idempotency_key,
       )
   except stripe.error.CardError as e:
       # Card was declined — tell the user
       log.warning(f"Card declined: {e.user_message}")
       return {"error": "card_declined", "message": e.user_message}, 402
   except stripe.error.RateLimitError:
       # Too many requests — retry with backoff
       log.error("Stripe rate limit hit, retrying...")
       raise RetryableError()
   except stripe.error.InvalidRequestError as e:
       # Invalid parameters — this is a bug in our code
       log.error(f"Invalid Stripe request: {e}")
       raise
   except stripe.error.APIConnectionError:
       # Network issue — retry
       log.error("Cannot reach Stripe API")
       raise RetryableError()
   except stripe.error.StripeError as e:
       # Generic Stripe error
       log.error(f"Stripe error: {e}")
       raise
   ```

5. **Webhook verification is a MUST**

   ```python
   # BAD — trusting webhook payload without verification
   @app.route("/webhooks/stripe", methods=["POST"])
   def handle_webhook():
       event = json.loads(request.data)
       process_event(event)

   # GOOD — verify webhook signature
   @app.route("/webhooks/stripe", methods=["POST"])
   def handle_webhook():
       payload = request.data
       sig_header = request.headers.get("Stripe-Signature")
       try:
           event = stripe.Webhook.construct_event(
               payload, sig_header, WEBHOOK_SECRET
           )
       except ValueError:
           return "Invalid payload", 400
       except stripe.error.SignatureVerificationError:
           return "Invalid signature", 400

       process_event(event)
       return "", 200
   ```

### Pro Tips for Integration Round

- **Read the prompt carefully.** Understand ALL the requirements before writing code.
- **Start with the happy path.** Get it working, then add error handling.
- **Use idempotency keys.** This signals you understand Stripe's philosophy.
- **Write at least one test.** Even a simple integration test shows maturity.
- **Ask clarifying questions.** The interviewer wants to see you think about requirements.

---

## Top 10 Most-Asked Questions

### Overview Table

| # | Question | Level | Vault Link | Stripe Emphasis |
|---|---|---|---|---|
| 1 | Design a Payment Processing System | L2-L4 | [[10_hld/examples/hld_payment_system]] | Idempotency, saga pattern, reconciliation |
| 2 | Design a Webhook Delivery System | L2-L4 | [[05_case_studies/design_notification_system]] | At-least-once delivery, retry with backoff |
| 3 | Design a Rate Limiter for API | L2-L3 | [[05_case_studies/design_rate_limiter]] | Per-merchant fairness, graceful degradation |
| 4 | Design a Subscription/Billing System | L3-L4 | — | Proration, dunning, invoice generation |
| 5 | Design an Idempotent API Layer | L2-L4 | [[01_fundamentals/api_design]] | Idempotency key storage, replay detection |
| 6 | Design a Fraud Detection Pipeline | L3-L4 | — | Real-time scoring, ML pipeline, false positive rate |
| 7 | Design a Multi-Currency Transaction System | L3-L4 | — | FX rates, settlement, rounding rules |
| 8 | Design a Ledger System | L3-L5 | — | Double-entry bookkeeping, immutability, audit |
| 9 | Design an API Versioning System | L3-L4 | — | Stripe keeps old versions forever |
| 10 | Design a Merchant Onboarding/KYC Pipeline | L3-L4 | — | Compliance, async verification, state machine |

---

### Question 1: Design a Payment Processing System

**Level:** L2-L4
**Vault Link:** [[10_hld/examples/hld_payment_system]]
**Frequency:** Asked in ~60% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

- Idempotency keys on every mutating API call
- The saga pattern for multi-step payment flows ([[03_design_patterns/saga_pattern]])
- Reconciliation as a first-class concern, not an afterthought
- Handling partial failures (e.g., authorized but not captured)
- PCI-DSS implications on system architecture
- Event sourcing for payment state changes ([[03_design_patterns/event_sourcing]])

**Key API to design:**
```
POST   /v1/payment_intents          — Create a payment intent
GET    /v1/payment_intents/:id      — Retrieve a payment intent
POST   /v1/payment_intents/:id/confirm   — Confirm (authorize)
POST   /v1/payment_intents/:id/capture   — Capture authorized funds
POST   /v1/payment_intents/:id/cancel    — Cancel
POST   /v1/refunds                  — Refund a payment
```

**State machine to draw:**
```
                    +--> requires_action --> succeeded
                    |         |
created --> requires_payment_method --> requires_confirmation
                    |                         |
                    |                    +--> processing --> succeeded
                    |                    |                      |
                    |                    |                  canceled
                    |                    |
                    +--> canceled        +--> requires_capture --> succeeded
                                                    |
                                                    +--> canceled
```

Full walkthrough in [Sample Walkthrough](#sample-walkthrough--design-a-payment-processing-system) below.

---

### Question 2: Design a Webhook Delivery System

**Level:** L2-L4
**Vault Link:** [[05_case_studies/design_notification_system]]
**Frequency:** Asked in ~40% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

- **At-least-once delivery guarantee** — webhooks MUST eventually be delivered
- **Retry strategy** with exponential backoff (Stripe retries for up to 3 days)
- **Idempotent consumers** — since at-least-once means duplicates are possible
- **Webhook signature verification** — HMAC-SHA256 with a shared secret
- **Ordering** — Stripe does NOT guarantee ordering; design for out-of-order events
- **Event types and filtering** — merchants subscribe to specific event types

**Retry schedule to mention:**
```
Attempt 1:  Immediate
Attempt 2:  1 minute later
Attempt 3:  5 minutes later
Attempt 4:  30 minutes later
Attempt 5:  2 hours later
Attempt 6:  8 hours later
Attempt 7:  1 day later
Attempt 8:  2 days later
Attempt 9:  3 days later
(Give up after ~3 days, mark as failed, alert merchant)
```

**Core components:**
- Event store (immutable log of all events)
- Delivery queue (Kafka or SQS with per-merchant partitioning)
- Delivery workers (HTTP POST to merchant endpoints)
- Retry scheduler (exponential backoff with jitter)
- Dead letter queue for permanently failed deliveries
- Dashboard for merchants to view delivery status and replay events

See: [[02_building_blocks/message_queues]]

---

### Question 3: Design a Rate Limiter for API

**Level:** L2-L3
**Vault Link:** [[05_case_studies/design_rate_limiter]]
**Frequency:** Asked in ~30% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

- **Per-merchant fairness** — one noisy merchant must not affect others
- **Tiered limits** — different limits for different API endpoints and plan tiers
- **Graceful degradation** — return 429 with `Retry-After` header, not 500
- **Live vs test mode** — different limits for live and test API keys
- **Distributed rate limiting** — consistent across multiple API gateway instances
- **Observability** — merchants can see their current usage and limits

**Stripe's actual rate limit headers:**
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 1
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1625000000

{
  "error": {
    "type": "rate_limit_error",
    "message": "Too many requests. Please retry after 1 second."
  }
}
```

**Algorithm choice discussion:**
- Token bucket (Stripe's likely choice) — smooth, allows bursts
- Sliding window — more precise but more complex
- Fixed window — simplest but has boundary burst problem

---

### Question 4: Design a Subscription/Billing System

**Level:** L3-L4
**Frequency:** Asked in ~35% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

- **Proration** — what happens when a customer upgrades mid-cycle?
- **Dunning** — automated retry logic for failed subscription payments
- **Invoice generation** — creating invoices at the right time
- **Trial periods** — free trials with automatic conversion
- **Metered billing** — usage-based pricing (report usage, bill at period end)
- **Tax calculation** — integrating with tax systems (Stripe Tax)
- **Subscription lifecycle state machine**

**Subscription states:**
```
trialing --> active --> past_due --> canceled
    |          |          |
    |          |          +--> active (payment retry succeeds)
    |          |
    |          +--> canceled (customer cancels)
    |          +--> paused
    |
    +--> active (trial ends, first payment succeeds)
    +--> past_due (trial ends, first payment fails)
```

**Dunning (retry) schedule to mention:**
```
Day 0:   Initial charge fails
Day 1:   Retry #1
Day 3:   Retry #2 + email to customer
Day 5:   Retry #3 + email with warning
Day 7:   Retry #4 + final warning email
Day 14:  Cancel subscription, send cancellation email
```

See: [[10_hld/examples/hld_ecommerce]]

---

### Question 5: Design an Idempotent API Layer

**Level:** L2-L4
**Vault Link:** [[01_fundamentals/api_design]]
**Frequency:** Asked in ~25% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

- **Idempotency key storage** — where and how to store keys
- **Replay detection** — returning cached responses for duplicate requests
- **Key expiration** — Stripe expires idempotency keys after 24 hours
- **Concurrent request handling** — what if two requests with the same key arrive simultaneously?
- **Scope** — idempotency keys are scoped to the API key (merchant)

**Request flow:**
```
Client sends: POST /v1/charges
               Idempotency-Key: abc123

Server:
  1. Check idempotency store for key "abc123" (scoped to merchant)
  2. If found AND completed:
       Return cached response (same status code, same body)
  3. If found AND in-progress:
       Return 409 Conflict (another request is processing)
  4. If not found:
       a. Insert key with status "in_progress" (with lock)
       b. Process the request
       c. Store the response alongside the key
       d. Update status to "completed"
       e. Return the response
```

**Storage schema:**
```sql
CREATE TABLE idempotency_keys (
    id              BIGSERIAL PRIMARY KEY,
    key             VARCHAR(255) NOT NULL,
    api_key_id      BIGINT NOT NULL,       -- scope to merchant
    request_method  VARCHAR(10) NOT NULL,
    request_path    VARCHAR(512) NOT NULL,
    request_body    JSONB NOT NULL,
    response_code   INTEGER,
    response_body   JSONB,
    status          VARCHAR(20) NOT NULL,  -- in_progress, completed, error
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    UNIQUE (key, api_key_id)
);
```

---

### Question 6: Design a Fraud Detection Pipeline

**Level:** L3-L4
**Frequency:** Asked in ~20% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

- **Real-time scoring** — fraud decision must happen in <100ms (during payment flow)
- **ML pipeline** — feature extraction, model training, model serving
- **Rule engine** — merchant-configurable rules (Stripe Radar)
- **False positive rate** — blocking a legitimate transaction is also costly
- **Feedback loop** — disputes/chargebacks feed back into model training
- **Feature store** — precomputed features for fast inference

**Key signals (features) to mention:**
```
- Card fingerprint (have we seen this card before?)
- IP geolocation vs billing address
- Velocity (how many charges in the last hour from this card?)
- Device fingerprint
- Email domain reputation
- Transaction amount vs merchant average
- Time of day patterns
- Shipping address vs billing address
- CVC/AVS check results
```

**Architecture:**
```
Payment Request
      |
      v
+--[Feature Extraction]--+
|  - Card history         |
|  - IP signals           |
|  - Velocity counters    |
|  - Device fingerprint   |
+----------+--------------+
           |
           v
+--[Scoring Engine]-------+
|  - ML Model (real-time) |
|  - Rule Engine           |
|  - Risk score 0-100     |
+----------+--------------+
           |
     +-----+------+
     |            |
  score < 50   score >= 50
     |            |
   ALLOW     REVIEW/BLOCK
```

---

### Question 7: Design a Multi-Currency Transaction System

**Level:** L3-L4
**Frequency:** Asked in ~15% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

- **FX rate management** — rates change constantly; which rate do you lock?
- **Settlement currency** — merchant receives in their home currency
- **Presentment currency** — customer pays in their local currency
- **Rounding rules** — different currencies have different decimal places
- **Currency-specific rules** — JPY has 0 decimals, BHD has 3 decimals

**Currency decimal places:**
```
USD — 2 decimals (100 cents = $1.00)
EUR — 2 decimals (100 cents = 1.00 EUR)
JPY — 0 decimals (1 JPY is the smallest unit)
BHD — 3 decimals (1000 fils = 1 BHD)
```

**Key design decisions:**
- Store amounts in the **smallest currency unit** (cents for USD, yen for JPY)
- Lock FX rate at **authorization time**, not capture time
- Store both **original amount + currency** and **settlement amount + currency**
- Use **BigDecimal** for all currency math, never floating point

---

### Question 8: Design a Ledger System

**Level:** L3-L5
**Frequency:** Asked in ~20% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

- **Double-entry bookkeeping** — every transaction has a debit AND a credit
- **Immutability** — ledger entries are NEVER modified, only appended
- **Audit trail** — every entry has a timestamp, actor, and reason
- **Balance calculation** — sum of all debits and credits for an account
- **Reconciliation** — comparing ledger with external systems (banks)
- **ACID transactions** — a ledger entry must be atomic

**Double-entry example:**
```
When a customer pays $100 to a merchant:

Entry 1 (Debit):
  Account: customer_payment_account
  Amount:  -$100.00
  Type:    DEBIT

Entry 2 (Credit):
  Account: merchant_pending_balance
  Amount:  +$97.10  (after 2.9% fee)
  Type:    CREDIT

Entry 3 (Credit):
  Account: stripe_revenue
  Amount:  +$2.90   (Stripe's fee)
  Type:    CREDIT

Invariant: Sum of all entries = $0.00 (debits + credits must balance)
```

**Schema:**
```sql
CREATE TABLE ledger_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id  UUID NOT NULL,           -- groups related entries
    account_id      UUID NOT NULL,
    amount_cents    BIGINT NOT NULL,          -- positive = credit, negative = debit
    currency        VARCHAR(3) NOT NULL,
    entry_type      VARCHAR(10) NOT NULL,     -- DEBIT or CREDIT
    description     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(255) NOT NULL     -- actor / system
);

-- Entries in a transaction MUST sum to zero
-- This is enforced at the application layer AND verified by reconciliation
```

---

### Question 9: Design an API Versioning System

**Level:** L3-L4
**Frequency:** Asked in ~15% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

Stripe has one of the most sophisticated API versioning systems in the industry. Key facts:

- Stripe keeps **every API version alive forever** (or for many years)
- Merchants pin to a version and can upgrade when ready
- New accounts get the latest version
- Version is specified via the `Stripe-Version` header or dashboard setting

**How Stripe implements versioning internally (the "version changelog" pattern):**

```
Instead of maintaining N separate codepaths for N versions,
Stripe uses a chain of version transformers:

Request comes in with version 2020-08-27:

  request (v2020-08-27)
       |
       v
  [Transform 2020-08-27 -> 2021-01-15]
       |
       v
  [Transform 2021-01-15 -> 2022-03-10]
       |
       v
  [Transform 2022-03-10 -> 2023-06-01]
       |
       v
  [Transform 2023-06-01 -> 2024-01-01]  (current internal version)
       |
       v
  Process request using CURRENT internal code
       |
       v
  [Reverse transform 2024-01-01 -> 2023-06-01]
       |
       v
  [Reverse transform 2023-06-01 -> 2022-03-10]
       |
       v
  [Reverse transform 2022-03-10 -> 2021-01-15]
       |
       v
  [Reverse transform 2021-01-15 -> 2020-08-27]
       |
       v
  response (v2020-08-27)
```

Each version change is a **small, well-tested transformation function** that converts
between adjacent versions. This means:
- Internal code only deals with the LATEST version
- Adding a new version only requires ONE new transformation
- Old versions are automatically supported by chaining transformations

---

### Question 10: Design a Merchant Onboarding / KYC Pipeline

**Level:** L3-L4
**Frequency:** Asked in ~15% of Stripe system design rounds

**What Stripe Specifically Emphasizes:**

- **KYC (Know Your Customer)** — legal requirement to verify merchant identity
- **Async verification** — document checks take hours/days, not milliseconds
- **State machine** — merchant goes through multiple verification stages
- **Progressive onboarding** — let merchants start accepting payments before full verification
- **Compliance** — different requirements per country (US, EU, India all differ)
- **Document storage** — secure storage of sensitive identity documents

**Onboarding state machine:**
```
created --> information_requested --> document_submitted
                                          |
                    +---------------------+--------------------+
                    |                     |                    |
               verified            needs_review          rejected
                    |                     |                    |
                 enabled          manual_review          appeal
                                      |                    |
                              +-------+-------+       verified
                              |               |
                          verified         rejected
```

---

## Stripe-Specific Patterns

These patterns come up repeatedly in Stripe system design interviews. Knowing them
demonstrates deep understanding of Stripe's engineering philosophy.

### 1. Idempotency Keys Everywhere

Every mutating API call at Stripe accepts an `Idempotency-Key` header. This is not
optional for critical operations — it is fundamental to how Stripe achieves reliability.

```http
POST /v1/payment_intents HTTP/1.1
Host: api.stripe.com
Authorization: Bearer sk_live_...
Idempotency-Key: order_12345_payment_attempt_1
Content-Type: application/x-www-form-urlencoded

amount=2000&currency=usd
```

**Rules:**
- Keys are scoped to the API key (merchant)
- Keys expire after 24 hours
- Same key + same parameters = return cached result
- Same key + different parameters = return 400 error
- Keys are stored in a fast lookup store (Redis-backed or similar)

### 2. Exactly-Once Semantics (via Idempotent At-Least-Once)

True exactly-once delivery is impossible in distributed systems. Stripe achieves
the equivalent through idempotent at-least-once:

```
             +--[Retry if timeout]--+
             |                      |
Client ----> | ----> API Gateway ----> Payment Service
             |          |
             |     [Check idempotency key]
             |          |
             |     [If duplicate, return cached response]
             |          |
             |     [If new, process and cache response]
             +----------+
```

The client can safely retry any request. The server ensures each unique operation
happens exactly once by checking the idempotency key before processing.

### 3. API Versioning (Versions Live Forever)

Stripe's approach to API versioning is unique in the industry:

- **Pin on creation:** Each merchant is pinned to the API version that existed when
  they created their account
- **Explicit upgrade:** Merchants upgrade versions through the dashboard
- **Header override:** Any request can specify `Stripe-Version` to use a different version
- **Changelog pattern:** Internally, version differences are expressed as small
  transformation functions chained together (see Question 9 above)

**Why this matters in interviews:** It shows you understand backward compatibility
as a first-class concern, not an afterthought.

### 4. Webhook Reliability

Stripe treats webhook delivery as a critical reliability concern:

```
Event occurs (e.g., payment_intent.succeeded)
       |
       v
  [Write to event store] (durable, immutable)
       |
       v
  [Enqueue to delivery queue] (per-merchant partition)
       |
       v
  [Delivery worker]
       |
  +----+----+
  |         |
 2xx      non-2xx or timeout
  |         |
 DONE    [Schedule retry with exponential backoff]
            |
       (up to 3 days of retries)
            |
       [Dead letter queue + alert merchant]
```

**Key design points:**
- Events are stored FIRST, then delivered (store-then-forward)
- Delivery is at-least-once; merchants must handle duplicates
- Each event has a unique ID for deduplication
- Merchants can replay events from the dashboard

### 5. Financial Correctness (You Can NEVER Lose Money)

This is the single most important principle at Stripe. When designing any system:

- **Use integer arithmetic for money** (cents, not dollars)
- **Double-entry bookkeeping** for all fund movements
- **Reconciliation jobs** run continuously to detect discrepancies
- **Immutable audit logs** for every state change
- **Alerting** on any balance discrepancy, no matter how small

```python
# BAD
total = 19.99 + 0.01  # Might not equal 20.00

# GOOD
total_cents = 1999 + 1  # Always equals 2000
```

### 6. The Saga Pattern for Multi-Step Transactions

Payments often involve multiple steps that must either all succeed or all be rolled back:

See: [[03_design_patterns/saga_pattern]]

```
Step 1: Authorize card          (reversible: void authorization)
Step 2: Reserve inventory       (reversible: release inventory)
Step 3: Create ledger entry     (reversible: create reversal entry)
Step 4: Capture payment         (reversible: refund)
Step 5: Notify merchant         (not reversible, but idempotent)

If Step 3 fails:
  - Compensate Step 2: release inventory
  - Compensate Step 1: void authorization
  - Log failure, alert, return error to caller
```

### 7. Event Sourcing for Payment State

Instead of storing only the current state, Stripe stores every state transition:

See: [[03_design_patterns/event_sourcing]]

```
payment_intent_created      {amount: 2000, currency: "usd", merchant: "acct_123"}
payment_method_attached     {payment_method: "pm_456", type: "card"}
payment_intent_confirmed    {confirmation_method: "automatic"}
charge_created              {charge_id: "ch_789", status: "pending"}
charge_succeeded            {charge_id: "ch_789", network_response: "approved"}
payment_intent_succeeded    {amount_received: 2000}
```

**Benefits:**
- Complete audit trail
- Can reconstruct state at any point in time
- Enables event-driven architecture (webhooks are generated from these events)
- Debugging production issues becomes reviewing the event log

### 8. Strong Typing and Expandable Objects

Stripe's API uses a pattern of "expandable" objects to balance between data minimalism
and convenience:

```json
// Default response (unexpanded):
{
  "id": "pi_123",
  "object": "payment_intent",
  "customer": "cus_456",       // Just the ID
  "payment_method": "pm_789"   // Just the ID
}

// Expanded response (with ?expand[]=customer):
{
  "id": "pi_123",
  "object": "payment_intent",
  "customer": {                 // Full customer object
    "id": "cus_456",
    "object": "customer",
    "email": "user@example.com",
    "name": "Jane Doe"
  },
  "payment_method": "pm_789"   // Still just the ID (not requested)
}
```

---

## Sample Walkthrough — Design a Payment Processing System

This is a full walkthrough of the most common Stripe system design question, done
"the Stripe way." Use this as a template for your preparation.

Use: [[07_interview_framework/the_four_step_framework]]
Reference: [[10_hld/examples/hld_payment_system]]

### Step 1: Requirements and Scope (5 minutes)

**Functional Requirements:**
- Accept payments from customers on behalf of merchants
- Support credit/debit cards as the primary payment method
- Handle authorization, capture, and refund flows
- Send webhook events to merchants for payment status changes
- Support idempotent API calls

**Non-Functional Requirements:**
- **Correctness:** No double charges, no lost transactions — the highest priority
- **Availability:** 99.999% uptime (payments are critical infrastructure)
- **Latency:** Authorization in <500ms (card network timeout is typically 30s)
- **Scalability:** Handle 1000s of transactions per second
- **Auditability:** Full audit trail for every transaction

**Out of Scope (clarify with interviewer):**
- Subscription billing (separate system)
- Fraud detection (separate service, but mention the integration point)
- Multi-currency (mention but do not deep-dive unless asked)

### Step 2: API Design (10 minutes)

This is where Stripe interviews differ. Spend significant time here.

**Create Payment Intent:**
```http
POST /v1/payment_intents
Idempotency-Key: order_abc_attempt_1
Authorization: Bearer sk_live_merchant123

{
  "amount": 2000,
  "currency": "usd",
  "payment_method_types": ["card"],
  "metadata": {
    "order_id": "order_abc"
  }
}

Response (201 Created):
{
  "id": "pi_1234567890",
  "object": "payment_intent",
  "amount": 2000,
  "currency": "usd",
  "status": "requires_payment_method",
  "client_secret": "pi_1234567890_secret_xyz",
  "created": 1625000000,
  "livemode": true,
  "metadata": {
    "order_id": "order_abc"
  }
}
```

**Confirm Payment Intent:**
```http
POST /v1/payment_intents/pi_1234567890/confirm
Idempotency-Key: order_abc_confirm_1

{
  "payment_method": "pm_card_visa"
}

Response (200 OK):
{
  "id": "pi_1234567890",
  "status": "succeeded",
  "amount_received": 2000,
  "charges": {
    "data": [
      {
        "id": "ch_abc123",
        "amount": 2000,
        "status": "succeeded"
      }
    ]
  }
}
```

**Error Response:**
```http
Response (402 Payment Required):
{
  "error": {
    "type": "card_error",
    "code": "card_declined",
    "message": "Your card was declined.",
    "decline_code": "insufficient_funds",
    "charge": "ch_abc123"
  }
}
```

### Step 3: High-Level Architecture (15 minutes)

```
                     +------------------+
                     |   Load Balancer  |
                     +--------+---------+
                              |
                     +--------v---------+
                     |   API Gateway    |
                     | (Auth, Rate      |
                     |  Limit, Version) |
                     +--------+---------+
                              |
              +---------------+---------------+
              |                               |
     +--------v---------+           +--------v---------+
     | Payment Intent   |           | Idempotency      |
     | Service          |           | Service          |
     +--------+---------+           +------------------+
              |
     +--------v---------+
     | Payment          |
     | Orchestrator     |  <--- Saga Coordinator
     +--------+---------+
              |
    +---------+---------+---------+
    |         |         |         |
+---v---+ +---v---+ +---v---+ +---v---+
| Card  | | Fraud | | Ledger| | Event |
| Net-  | | Check | | Svc   | | Store |
| work  | | Svc   | |       | |       |
| Proxy | +-------+ +-------+ +---+---+
+---+---+                         |
    |                         +---v---+
    v                         |Webhook|
[Visa/MC/                     |Deliver|
 Amex]                        +-------+
```

**Component Responsibilities:**

| Component | Responsibility |
|---|---|
| API Gateway | Authentication, rate limiting, API versioning, routing |
| Payment Intent Service | CRUD for payment intents, state machine management |
| Idempotency Service | Store and check idempotency keys, return cached responses |
| Payment Orchestrator | Coordinate the multi-step payment saga |
| Card Network Proxy | Communicate with Visa/MC/Amex (PCI-scoped) |
| Fraud Check Service | Real-time fraud scoring before authorization |
| Ledger Service | Double-entry bookkeeping for all fund movements |
| Event Store | Immutable log of all events (for webhooks and audit) |
| Webhook Delivery | Deliver events to merchant endpoints |

### Step 4: Deep Dives (20 minutes)

#### Deep Dive 1: The Payment Saga

Reference: [[03_design_patterns/saga_pattern]]

```
Payment Orchestrator executes this saga:

1. VALIDATE
   - Check payment intent is in correct state
   - Validate amount, currency, payment method
   - If invalid: return 400 error (no saga needed)

2. FRAUD CHECK
   - Call Fraud Check Service with transaction details
   - If high risk: block payment, update state to "canceled"
   - Compensation: none needed (no funds moved yet)

3. AUTHORIZE
   - Call Card Network Proxy to authorize the charge
   - If declined: update state, return decline reason
   - Compensation: void the authorization

4. RECORD IN LEDGER
   - Create double-entry ledger entries
   - Debit: customer funds, Credit: merchant pending balance + Stripe fee
   - If fails: void authorization (Step 3 compensation)
   - Compensation: create reversal entries

5. EMIT EVENT
   - Write payment_intent.succeeded event to Event Store
   - Trigger webhook delivery
   - If fails: this is retryable; the payment itself succeeded
   - Compensation: not needed (event delivery retries independently)

6. UPDATE STATE
   - Update payment intent status to "succeeded"
   - This is the final step; if it fails, reconciliation catches it
```

#### Deep Dive 2: Idempotency Implementation

```
For every mutating request:

1. Extract idempotency key from header
2. Hash: SHA256(api_key + idempotency_key)
3. Try to acquire lock in Redis:
     SET idempotency:{hash} "processing" NX EX 60
4. If lock acquired (new request):
     a. Process the request
     b. Store result: SET idempotency:{hash}:result {response_json} EX 86400
     c. Release lock
     d. Return response
5. If lock NOT acquired (duplicate):
     a. Check if result exists: GET idempotency:{hash}:result
     b. If result exists: return cached response
     c. If no result yet: return 409 Conflict (another request in progress)
```

#### Deep Dive 3: Reconciliation

```
Reconciliation runs as a batch job every hour:

1. INTERNAL RECONCILIATION
   - Compare payment intent states with ledger entries
   - Every "succeeded" payment intent must have matching ledger entries
   - Every ledger transaction must sum to zero
   - Flag any discrepancies for manual review

2. EXTERNAL RECONCILIATION
   - Compare our records with card network settlement files
   - Networks send settlement files daily
   - Match each settlement with our charge records
   - Flag: charges we have but network does not (authorization not settled)
   - Flag: charges network has but we do not (CRITICAL — investigate immediately)

3. ALERTING
   - Any discrepancy > $0.01 triggers an alert
   - Discrepancies are tracked as incidents
   - Monthly reconciliation reports for compliance
```

#### Deep Dive 4: Data Storage

```sql
-- Payment Intents (primary state)
CREATE TABLE payment_intents (
    id              VARCHAR(30) PRIMARY KEY,  -- pi_xxxxx
    merchant_id     VARCHAR(30) NOT NULL,
    amount          BIGINT NOT NULL,          -- in smallest currency unit
    currency        VARCHAR(3) NOT NULL,
    status          VARCHAR(30) NOT NULL,
    payment_method  VARCHAR(30),
    client_secret   VARCHAR(100) NOT NULL,
    metadata        JSONB,
    created_at      TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1 -- optimistic locking
);

-- Charges (actual money movement)
CREATE TABLE charges (
    id                  VARCHAR(30) PRIMARY KEY,  -- ch_xxxxx
    payment_intent_id   VARCHAR(30) NOT NULL REFERENCES payment_intents(id),
    amount              BIGINT NOT NULL,
    currency            VARCHAR(3) NOT NULL,
    status              VARCHAR(20) NOT NULL,
    network_response    JSONB,
    failure_code        VARCHAR(50),
    failure_message     TEXT,
    created_at          TIMESTAMP NOT NULL
);

-- Events (immutable log)
CREATE TABLE events (
    id          VARCHAR(30) PRIMARY KEY,  -- evt_xxxxx
    type        VARCHAR(100) NOT NULL,    -- payment_intent.succeeded
    data        JSONB NOT NULL,
    api_version VARCHAR(20) NOT NULL,
    created_at  TIMESTAMP NOT NULL,
    merchant_id VARCHAR(30) NOT NULL
);
CREATE INDEX idx_events_merchant_created ON events(merchant_id, created_at);
```

### Step 5: Wrap-Up (5 minutes)

**Trade-offs discussed:**
- **CP over AP:** We chose consistency over availability because financial correctness
  is non-negotiable. A payment system that is available but incorrect is worse than one
  that is briefly unavailable.
- **Saga over 2PC:** We chose the saga pattern over two-phase commit because sagas are
  more resilient to long-running operations (network calls to Visa can take seconds)
  and allow for better observability.
- **Event sourcing overhead:** Storing every event is expensive in storage but
  invaluable for debugging, auditing, and webhook delivery.

**Future enhancements mentioned:**
- Multi-currency support with FX rate locking
- 3D Secure (SCA) for European payments
- Multi-region deployment for latency and compliance

See also: [[12_hld_lld_bridge/zoom_payment]]

---

## Red Flags and Green Flags

Understanding what Stripe interviewers watch for can make the difference between
a hire and a no-hire. Code quality and thoughtfulness matter enormously at Stripe.

See also: [[07_interview_framework/common_red_flags]]

### Red Flags (Things That Will Hurt You)

| Red Flag | Why It Matters at Stripe |
|---|---|
| Using floating point for money | Immediate credibility loss; shows no financial systems awareness |
| Saying "we can tolerate some data loss" | NEVER acceptable for financial data |
| Ignoring idempotency | This is table stakes at Stripe; every mutating call must be idempotent |
| No error handling discussion | Stripe is obsessed with failure modes |
| "Just use a single database" with no nuance | Shows lack of distributed systems thinking |
| Skipping API design | API design IS the product at Stripe |
| Hand-wavy on consistency | "Eventual consistency is fine" — not for payments |
| No mention of reconciliation | Shows you have not worked with financial systems |
| Sloppy code in Bug Bash/Integration | Code quality is a core value at Stripe |
| Not asking clarifying questions | Stripe values communication and collaboration |
| Over-engineering from the start | Pragmatism matters; start simple, then scale |
| Ignoring security | PCI-DSS, encryption, access control are not afterthoughts |

### Green Flags (Things That Will Help You)

| Green Flag | Why It Matters at Stripe |
|---|---|
| Using integer cents for money | Shows financial systems awareness |
| Mentioning idempotency proactively | You understand Stripe's core philosophy |
| Drawing a state machine | Payment systems are state machines; this shows maturity |
| Discussing reconciliation | Shows real-world financial systems experience |
| Thoughtful API design | Spending time on endpoint naming, error codes, pagination |
| Discussing saga pattern for multi-step ops | Shows distributed systems depth |
| Mentioning double-entry bookkeeping | Shows you understand financial accounting basics |
| Explicit error handling | Every failure mode considered and handled |
| Talking about audit trails | Compliance and debugging awareness |
| Asking about consistency requirements | Shows you know consistency is a spectrum |
| Mentioning webhook signature verification | Security awareness in API integration |
| Clean, well-structured code | Stripe's #1 value in coding rounds |
| Discussing trade-offs explicitly | "I chose X because Y, at the cost of Z" |

---

## Preparation Checklist

Use this checklist in the weeks before your Stripe interview. Stripe interviews
are unique — generic FAANG prep is necessary but not sufficient.

### 4 Weeks Before

```
[ ] Read Stripe's API documentation (stripe.com/docs/api)
    Focus on: PaymentIntents, Charges, Refunds, Webhooks, Customers
[ ] Create a free Stripe test account and build a simple checkout
[ ] Read Stripe's engineering blog (stripe.com/blog/engineering)
    Key posts: "Idempotency keys", "Online migrations", "API versioning"
[ ] Study the Stripe API versioning changelog
[ ] Understand PCI-DSS basics (what it is, why it matters, scope reduction)
[ ] Review: [[01_fundamentals/acid_vs_base]]
[ ] Review: [[03_design_patterns/saga_pattern]]
[ ] Review: [[03_design_patterns/event_sourcing]]
```

### 3 Weeks Before

```
[ ] Practice the top 5 system design questions (see above)
    Pay special attention to:
    - Payment Processing System (the #1 question)
    - Webhook Delivery System
    - Rate Limiter
[ ] Review: [[10_hld/examples/hld_payment_system]]
[ ] Review: [[05_case_studies/design_notification_system]] (for webhooks)
[ ] Review: [[05_case_studies/design_rate_limiter]]
[ ] Study double-entry bookkeeping basics
[ ] Practice reading unfamiliar Ruby code (for Bug Bash)
[ ] Practice integrating with Stripe's API in your preferred language
```

### 2 Weeks Before

```
[ ] Do 2-3 timed Bug Bash practice sessions
    - Clone an open-source project, plant bugs, have a friend test you
    - Or use a debugging challenge platform
[ ] Do 2-3 timed Integration practice sessions
    - Build Stripe integrations from scratch under 60-minute time pressure
    - Focus on: error handling, webhook verification, idempotency keys
[ ] Practice the remaining 5 system design questions
[ ] Review: [[07_interview_framework/the_four_step_framework]]
[ ] Review: [[07_interview_framework/common_red_flags]]
[ ] Study Stripe's company values and recent news
```

### 1 Week Before

```
[ ] Do a full mock interview loop (all 4 rounds, timed)
[ ] Review your notes on all 10 system design questions
[ ] Prepare your "Why Stripe?" answer (be genuine and specific)
[ ] Prepare 2-3 questions to ask your interviewers
    Good questions:
    - "What is the most interesting technical challenge your team solved recently?"
    - "How does Stripe handle API versioning for breaking changes?"
    - "What does the on-call experience look like on your team?"
[ ] Review the Sample Walkthrough one more time
[ ] Get a good night's sleep
```

### Day Of

```
[ ] Have Stripe's API docs open in a browser tab (you may reference them)
[ ] Have a blank document open for notes
[ ] Test your IDE/editor setup (for Bug Bash and Integration)
[ ] Test your microphone and camera
[ ] Have water nearby
[ ] Remember: Stripe values CORRECTNESS over speed, QUALITY over completion
```

---

## Quick Reference: Stripe vs FAANG Comparison

| Aspect | FAANG Prep | Stripe Prep |
|---|---|---|
| LeetCode | 200+ problems | Not needed (no DSA rounds) |
| System Design | Generic distributed systems | Payments-focused, API-centric |
| Coding | Speed + correctness | Quality + error handling + readability |
| Debugging | Not typically tested | Bug Bash is a core round |
| API Integration | Not typically tested | Integration is a core round |
| Domain Knowledge | Not expected | Basic payments knowledge helps a lot |
| Writing | Less emphasis | Strong emphasis (culture of writing) |
| Behavioral | STAR method | Values alignment + collaboration |

---

## Key Resources

| Resource | URL | Notes |
|---|---|---|
| Stripe API Docs | stripe.com/docs/api | Read the PaymentIntents section thoroughly |
| Stripe Engineering Blog | stripe.com/blog/engineering | Read the top 10 posts |
| "Designing Data-Intensive Applications" | Book by Martin Kleppmann | Chapters on consistency, events |
| Stripe's Idempotency Blog Post | stripe.com/blog/idempotency | Essential reading |
| Stripe's API Versioning Post | stripe.com/blog/api-versioning | Understand the changelog pattern |
| Stripe Press | press.stripe.com | Shows Stripe's intellectual culture |

---

## Related Vault Notes

- [[10_hld/examples/hld_payment_system]] — Full HLD for a payment system
- [[10_hld/examples/hld_ecommerce]] — E-commerce system design (overlaps with billing)
- [[05_case_studies/design_notification_system]] — Webhook delivery parallels
- [[05_case_studies/design_rate_limiter]] — API rate limiting deep dive
- [[01_fundamentals/api_design]] — API design fundamentals
- [[01_fundamentals/acid_vs_base]] — Consistency models (Stripe defaults to ACID)
- [[02_building_blocks/message_queues]] — Queue systems for async processing
- [[03_design_patterns/saga_pattern]] — Multi-step transaction coordination
- [[03_design_patterns/event_sourcing]] — Event log as source of truth
- [[12_hld_lld_bridge/zoom_payment]] — Payment system bridge from HLD to LLD
- [[07_interview_framework/the_four_step_framework]] — General interview framework
- [[07_interview_framework/common_red_flags]] — Interview anti-patterns

---

> **Final Thought:** Stripe is a company that believes software infrastructure can change the
> world. They are not looking for the fastest coder or the person who has memorized the most
> algorithms. They are looking for engineers who care deeply about correctness, who write
> clean and thoughtful code, and who can reason about complex systems where failure has
> real financial consequences. If you internalize this philosophy, you will do well.
