# PhonePe & CRED — System Design Interview Guide

> **Why combined?** Both are Bangalore-based fintech companies, both are Java-heavy, and
> both heavily test UPI/payments knowledge in system design rounds. Preparing for one
> covers 80% of the other.

**Navigation:** [[17_company_interview_guide/index]] | [[07_interview_framework/the_four_step_framework]]

---

## Table of Contents

1. [Company Overview](#company-overview)
2. [Compensation Bands](#compensation-bands)
3. [Interview Process](#interview-process)
4. [System Design Round Details](#system-design-round-details)
5. [Top 10 Most-Asked Questions](#top-10-most-asked-questions)
6. [Fintech-Specific Patterns](#fintech-specific-patterns)
7. [UPI Architecture Deep Dive](#upi-architecture-deep-dive)
8. [Sample Walkthrough — Design UPI Payment System](#sample-walkthrough--design-upi-payment-system)
9. [Red Flags and Green Flags](#red-flags-and-green-flags)
10. [Preparation Checklist](#preparation-checklist)

---

## Company Overview

### PhonePe

| Attribute          | Details                                                    |
| ------------------ | ---------------------------------------------------------- |
| **Founded**        | 2015 (by Sameer Nigam, Rahul Chari, Burzin Engineer)      |
| **Headquarters**   | Bangalore, India                                           |
| **Parent Company** | Walmart (via Flipkart acquisition, later separated in 2022)|
| **Valuation**      | ~$12B (as of 2024)                                         |
| **UPI Market Share**| ~48% of all UPI transactions in India (#1 by volume)      |
| **Users**          | 500M+ registered users                                     |
| **Products**       | UPI payments, wallet, insurance, mutual funds, lending     |
| **Tech Stack**     | Java (Spring Boot), Kafka, MySQL, Redis, Kubernetes        |
| **Engineering Size**| 1500+ engineers                                           |

PhonePe processes **billions** of UPI transactions monthly. Their engineering challenges
revolve around extreme scale (peak TPS during festivals), strict consistency for financial
data, and regulatory compliance with RBI mandates.

### CRED

| Attribute          | Details                                                    |
| ------------------ | ---------------------------------------------------------- |
| **Founded**        | 2018 (by Kunal Shah, formerly of FreeCharge)               |
| **Headquarters**   | Bangalore, India                                           |
| **Valuation**      | ~$6.4B (as of 2024)                                        |
| **Target Audience**| Premium users with credit score 750+ (top 20% of India)   |
| **Users**          | 35M+ members                                               |
| **Products**       | Credit card bill pay, CRED coins/rewards, rent pay, UPI   |
| **Tech Stack**     | Java (Spring Boot), Kotlin, PostgreSQL, Kafka, AWS         |
| **Engineering Size**| 300-400 engineers (lean, high-caliber team)               |

CRED is known for hiring selectively and paying a premium. Their engineering challenges
center around reward systems, gamification engines, payment processing, and building
a "members-only" premium experience.

### Key Differences for Candidates

| Dimension             | PhonePe                          | CRED                              |
| --------------------- | -------------------------------- | --------------------------------- |
| **Scale**             | Massive (billions of txns/month) | Moderate (millions of txns/month) |
| **Engineering Culture**| Move fast, scale-first          | Craft-first, design-oriented     |
| **Team Size**         | Large teams, clear ownership     | Small teams, broad ownership      |
| **Interview Style**   | Structured, process-heavy        | Unstructured, conversational      |
| **Compensation**      | Competitive                      | Premium (15-30% above market)     |
| **Growth Stage**      | Mature, profitable path          | Growth stage, cash-burn mode      |

---

## Compensation Bands

> **Disclaimer:** These numbers are approximate ranges based on publicly available data
> from Levels.fyi, Glassdoor, and community reports (2024-2025). Actual offers vary
> based on experience, negotiation, and stock grants.

### PhonePe Compensation (Annual, INR)

| Level        | YOE    | Base (LPA)  | ESOPs/RSU   | Total CTC (LPA) |
| ------------ | ------ | ----------- | ----------- | ---------------- |
| **SDE-1**    | 0-2    | 16-22       | 2-5         | 18-27            |
| **SDE-2**    | 2-5    | 24-35       | 5-12        | 30-47            |
| **SDE-3**    | 5-8    | 35-50       | 10-20       | 45-70            |
| **Staff**    | 8-12+  | 50-70       | 20-40       | 70-110           |
| **Principal**| 12+    | 70-90       | 40-80       | 110-170          |

- PhonePe ESOPs became more valuable after the Walmart separation and independent valuation.
- Variable bonus typically 10-15% of base.
- Joining bonus common for SDE-2 and above (3-8 LPA).

### CRED Compensation (Annual, INR)

| Level        | YOE    | Base (LPA)  | ESOPs       | Total CTC (LPA) |
| ------------ | ------ | ----------- | ----------- | ---------------- |
| **SDE-1**    | 0-2    | 20-28       | 5-10        | 25-38            |
| **SDE-2**    | 2-5    | 30-45       | 10-20       | 40-65            |
| **SDE-3**    | 5-8    | 45-60       | 20-35       | 65-95            |
| **Staff**    | 8-12+  | 60-85       | 35-60       | 95-145           |

- CRED consistently pays 15-30% above market for equivalent roles.
- ESOPs are significant but liquidity depends on IPO/secondary sale events.
- Smaller team means broader scope — an SDE-2 at CRED often does SDE-3 work elsewhere.
- CRED is known for aggressive counteroffers to retain talent.

### Comparison Summary

For the same YOE band (say 4-6 years):
- **PhonePe offer:** 40-55 LPA total
- **CRED offer:** 55-80 LPA total
- **Delta:** CRED pays ~25-40% more, but PhonePe offers more stability and scale exposure.

---

## Interview Process

### PhonePe Interview Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Online Test │───→│   Machine    │───→│     HLD      │───→│     LLD      │───→│   Hiring     │
│  (90 min)    │    │  Coding (90) │    │   Round (60) │    │  Round (60)  │    │Manager Round │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

**Round 1 — Online Assessment (90 min)**
- 2-3 DSA problems on HackerRank or similar platform
- Difficulty: Medium to Hard (Leetcode equivalent)
- Topics: Arrays, Trees, Graphs, DP, Greedy
- Cutoff: Typically need 2/3 fully solved

**Round 2 — Machine Coding Round (90 min)**
- Build a working application in Java (occasionally allowed Kotlin/Python)
- Common problems: Splitwise, parking lot, in-memory cache, task scheduler
- Evaluated on: SOLID principles, design patterns, code cleanliness, testability
- Must compile and run — partial solutions are rejected
- See [[11_lld/solid_with_refactoring]] for SOLID preparation

**Round 3 — High-Level Design (60 min)**
- Classic system design with fintech flavor
- Expect questions on payments, wallets, notifications
- Emphasis on consistency, fault tolerance, idempotency
- See [[07_interview_framework/the_four_step_framework]]

**Round 4 — Low-Level Design (60 min)**
- Class diagrams, API contracts, database schema
- Design patterns: Strategy, Observer, State Machine
- Often a continuation of the HLD topic — "now design the classes"

**Round 5 — Hiring Manager / Bar Raiser**
- Behavioral: conflict resolution, ownership stories, production incidents
- Technical depth: "Tell me about the hardest bug you fixed"
- Culture fit: fast-paced, startup-like within a large org

### CRED Interview Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Take-Home   │───→│   System     │───→│  Cultural    │───→│   Founder    │
│  Assignment  │    │ Design (75)  │    │  Fit Round   │    │    Round     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

**Round 1 — Take-Home Assignment (3-7 days)**
- Build a small but complete application (REST API, worker service, etc.)
- Common: payment processing simulator, bill aggregation service, rewards engine
- Evaluated on: Code quality, architecture decisions, README, test coverage
- Java or Kotlin preferred; some teams accept Go or Python
- This round is make-or-break — CRED rejects 70%+ at this stage

**Round 2 — System Design (75 min)**
- Deep dive into one fintech problem
- Interviewer expects you to discuss trade-offs, not just draw boxes
- Strong emphasis on data modeling and state machines
- Payment domain knowledge is a significant advantage

**Round 3 — Cultural Fit / Technical Discussion**
- Discussion about your take-home assignment — defend every design choice
- "Why did you choose X over Y?"
- Past projects, technical leadership, ownership
- CRED values craft and taste — sloppy code is a red flag even if functional

**Round 4 — Founder Round (Kunal Shah or senior leadership)**
- Big-picture thinking: product sense, business acumen
- "How would you build X from scratch?"
- Not always technical — sometimes about product intuition
- This round can override previous rounds (both ways)

### Both Companies: Common Themes

- **Java is king.** Both companies are Spring Boot shops. Know Java well.
- **Fintech domain is expected.** Unlike FAANG, they expect you to understand payments.
- **Production experience matters.** They ask about real incidents, scaling challenges.
- **LLD is not optional.** Both test low-level design rigorously.

---

## System Design Round Details

### Fintech System Design vs. Generic System Design

In a fintech interview, the priorities are fundamentally different from a typical
FAANG system design round. Here is the hierarchy:

```
Generic Tech Company:           Fintech Company:
1. Availability                 1. Correctness (money cannot be wrong)
2. Scalability                  2. Consistency (ACID over BASE)
3. Consistency                  3. Auditability (every txn traceable)
4. Correctness                  4. Compliance (RBI, PCI-DSS)
                                5. Availability
                                6. Scalability
```

### Core Principles for Fintech System Design

**1. Correctness Over Availability**
- In payments, showing "payment failed" when it actually succeeded is catastrophic.
- You MUST discuss how to handle ambiguous states (timeouts, partial failures).
- See [[01_fundamentals/acid_vs_base]] for the theory.

**2. ACID Compliance is Non-Negotiable**
- Financial transactions require strong consistency.
- Discuss: serializable isolation, write-ahead logs, two-phase commit.
- BASE (Basically Available, Soft state, Eventually consistent) is NOT acceptable
  for the core transaction path.
- See [[01_fundamentals/consistency_models]] for consistency spectrum.

**3. Double-Entry Bookkeeping**
- Every debit has a corresponding credit. Always. No exceptions.
- If you mention this unprompted, it signals deep fintech understanding.
- Schema pattern:
  ```
  ledger_entries:
    id, transaction_id, account_id, entry_type (DEBIT/CREDIT),
    amount, currency, created_at

  -- For every transaction:
  SUM(debits) == SUM(credits)  -- ALWAYS
  ```

**4. Idempotency is Critical**
- Network failures are common. Retries will happen.
- Every payment API MUST be idempotent.
- Pattern: client-generated idempotency key stored in DB with unique constraint.
- See [[03_design_patterns/distributed_locking]] for related patterns.

**5. RBI Compliance (India-Specific)**
- **Data Localization Mandate (2018):** All payment data of Indian users must be stored
  in India. Foreign processors can store data abroad only for processing, not storage.
- **Tokenization Mandate (2022):** Card-on-file data cannot be stored by merchants.
  Must use tokenized references via card networks.
- **KYC Requirements:** Full KYC for wallets above 10,000 INR limit.
- **Mention these proactively** — interviewers at PhonePe/CRED will be impressed.

**6. PCI-DSS Compliance**
- If your design handles card numbers, discuss PCI-DSS.
- Card data must be encrypted, access logged, environment segmented.
- Tokenization: replace card numbers with tokens for internal use.

**7. Reconciliation is Part of the Design**
- Every fintech system needs a reconciliation mechanism.
- Compare internal ledger vs. bank statements vs. NPCI records.
- Discuss: T+1 settlement, EOD reconciliation jobs, mismatch alerts.

### What Interviewers Are Looking For

| Signal                        | What to Say                                         |
| ----------------------------- | --------------------------------------------------- |
| **Idempotency**               | "Every API needs an idempotency key"                |
| **State Machine**             | "Payment goes through defined states with transitions"|
| **Double-Entry Ledger**       | "Every debit has a matching credit entry"            |
| **Saga Pattern**              | "Distributed transactions use compensating actions"  |
| **Reconciliation**            | "We need EOD recon jobs comparing internal vs bank"  |
| **Exactly-Once Semantics**    | "For money movement, at-least-once + idempotency"   |
| **Compliance**                | "Data localization per RBI mandate"                  |

---

## Top 10 Most-Asked Questions

### 1. Design UPI Payment System

**Frequency:** Asked at PhonePe in ~60% of interviews. Also common at CRED.
**Deep Dive:** [[10_hld/examples/hld_upi_payment]]

Key points to cover:
- Full UPI flow: Payer PSP → NPCI switch → Payee PSP → Banks
- VPA (Virtual Payment Address) resolution
- Collect vs. Pay flow
- Transaction state machine (INITIATED → PENDING → SUCCESS/FAILED)
- Handling NPCI timeouts (the dreaded "pending" state)
- Idempotency at every hop

### 2. Design Wallet System

**Frequency:** Common at both companies.
**Deep Dive:** [[10_hld/examples/hld_payment_system]]

Key points to cover:
- Wallet as a ledger (not a single balance field)
- Double-entry bookkeeping for every operation
- Load money (bank → wallet), spend money (wallet → merchant)
- Refund handling and reversals
- KYC-based limits (RBI mandates: 10K without KYC, 1L with full KYC)
- Concurrent transaction handling — see [[03_design_patterns/distributed_locking]]

### 3. Design Subscription Billing System

**Frequency:** Common at CRED (CRED has subscription products).

Key points to cover:
- Subscription lifecycle: trial → active → past_due → cancelled
- Billing cycle management (monthly, annual, proration)
- Retry logic for failed payments (exponential backoff with max attempts)
- Invoice generation and tax calculation
- Dunning management (grace period, payment retry schedule)
- Webhook notifications for state changes → [[05_case_studies/design_notification_system]]

### 4. Design Merchant Dashboard

**Frequency:** PhonePe (merchant payments is a major business line).

Key points to cover:
- Real-time transaction feed with filtering and search
- Settlement reports (daily, weekly, monthly)
- Refund management interface
- Analytics: GMV, success rate, average ticket size
- Role-based access control (owner, manager, viewer)
- Export functionality for large datasets (async job pattern)

### 5. Design Webhook Delivery System

**Frequency:** Both companies — payment status callbacks are critical.
**Related:** [[05_case_studies/design_notification_system]]

Key points to cover:
- At-least-once delivery guarantee
- Retry with exponential backoff (1s, 2s, 4s, 8s... up to 24h)
- Webhook signature verification (HMAC-SHA256)
- Dead letter queue for persistent failures
- Idempotency keys in webhook payload
- Delivery status tracking and merchant-facing retry UI
- Message queues for decoupling → [[02_building_blocks/message_queues]]

### 6. Design Splitwise (LLD)

**Frequency:** Very common as the LLD/machine coding round at PhonePe.
**Deep Dive:** [[11_lld/examples/lld_splitwise]]

Key points to cover:
- Expense types: EQUAL, EXACT, PERCENTAGE
- Simplify debts algorithm (minimize transactions using net balances)
- User, Group, Expense, Split entities
- Balance sheet per user pair
- SOLID principles — see [[11_lld/solid_with_refactoring]]

### 7. Design Payment State Machine

**Frequency:** PhonePe — this is core to their platform.

Key points to cover:
```
INITIATED → PROCESSING → PENDING_BANK_RESPONSE → SUCCESS
                                                → FAILED
                                                → TIMED_OUT → REQUIRES_RECON
         → REFUND_INITIATED → REFUND_PROCESSING → REFUNDED
                                                → REFUND_FAILED
```
- Each transition must be persisted before proceeding
- Invalid transitions must be rejected (e.g., cannot go from SUCCESS to INITIATED)
- Timeout handling: if bank does not respond in X seconds, mark TIMED_OUT
- Reconciliation job picks up TIMED_OUT transactions and resolves them
- Event sourcing for full audit trail → [[03_design_patterns/event_sourcing]]
- Saga pattern for multi-step payments → [[03_design_patterns/saga_pattern]]

### 8. Design Credit Card Bill Payment System (CRED-Specific)

**Frequency:** Very common at CRED — it is their core product.

Key points to cover:
- Bill fetch: integrate with card issuers (HDFC, ICICI, Axis, etc.) via APIs/scraping
- Bill parsing and normalization (each issuer has different formats)
- Payment orchestration: collect money from user → route to issuer
- Payment confirmation and receipt generation
- Multi-card management per user
- Rewards credit on successful payment (integration with coins engine)
- Statement caching and refresh strategy

### 9. Design Rewards/Coins Engine (CRED-Specific)

**Frequency:** Common at CRED — core differentiator.

Key points to cover:
- Earn rules engine: "Pay bill > 5000 → earn 500 coins"
- Burn rules: coins can be spent on deals, cashback, or products
- Coin ledger with double-entry bookkeeping (earn = credit, burn = debit)
- Expiry management (coins expire after 90 days of inactivity)
- Gamification: scratch cards, spin wheel (random reward with configurable odds)
- Rate limiting to prevent abuse → [[05_case_studies/design_rate_limiter]]
- Fraud detection: unusual earn patterns, automated redemption attempts

### 10. Design Fraud Detection Pipeline

**Frequency:** Both companies — fraud is a major concern.

Key points to cover:
- Real-time scoring: every transaction gets a risk score before approval
- Feature engineering: velocity checks, device fingerprinting, geo anomalies
- Rule engine (configurable by ops team without code changes)
- ML model serving (batch-trained, real-time inference)
- Alert and investigation workflow
- False positive handling (blocked legitimate users hurt business)
- Logging pipeline → [[05_case_studies/design_logging_system]]

---

## Fintech-Specific Patterns

### UPI Architecture (NPCI, PSP, Banks)

Understanding the UPI ecosystem is **mandatory** for PhonePe/CRED interviews.

**Key Entities:**

| Entity              | Role                                                   | Examples                  |
| ------------------- | ------------------------------------------------------ | ------------------------- |
| **NPCI**            | Central switch that routes all UPI transactions         | NPCI (sole operator)      |
| **PSP (Payment Service Provider)** | App that the user interacts with        | PhonePe, GPay, Paytm      |
| **Issuer Bank**     | Bank that holds the payer's money                      | SBI, HDFC, ICICI          |
| **Acquirer Bank**   | Bank that receives money on behalf of the payee        | Yes Bank, Axis Bank       |
| **Remitter Bank**   | Same as Issuer (payer's bank)                          | -                         |
| **Beneficiary Bank**| Same as Acquirer (payee's bank)                        | -                         |
| **VPA**             | Virtual Payment Address (user@psp)                     | user@ybl, user@ibl        |
| **Handle**          | The PSP identifier in VPA                              | @ybl (PhonePe), @okhdfcbank|

### Payment State Machines

Every payment system needs a well-defined state machine. This is the single most
important concept in fintech system design.

```
                    ┌─────────────────────────────────────────────┐
                    │              PAYMENT STATES                  │
                    ├─────────────────────────────────────────────┤
                    │                                             │
                    │   CREATED ──→ INITIATED ──→ PROCESSING     │
                    │                                │            │
                    │                    ┌───────────┼──────────┐ │
                    │                    ▼           ▼          ▼ │
                    │               SUCCESS      FAILED    TIMED_OUT
                    │                  │                        │ │
                    │                  ▼                        ▼ │
                    │           REFUND_INITIATED        RECON_PENDING
                    │                  │                        │ │
                    │                  ▼                        ▼ │
                    │              REFUNDED           RESOLVED_SUCCESS
                    │                               RESOLVED_FAILED │
                    └─────────────────────────────────────────────┘
```

**Rules for state transitions:**
1. Every transition must be persisted BEFORE any side effect.
2. State transitions must be atomic (use DB transactions).
3. Only valid transitions are allowed — validate against a transition table.
4. Every state change emits an event (for downstream consumers).

### Idempotency Keys

```java
// Client sends:
POST /api/v1/payments
Headers:
  Idempotency-Key: "client-generated-uuid-12345"
Body:
  { "amount": 500, "from": "user@ybl", "to": "merchant@ybl" }

// Server logic:
1. Check if idempotency_key exists in DB
2. If YES → return cached response (do NOT reprocess)
3. If NO  → process payment, store result against key
4. Key expires after 24-48 hours
```

This pattern prevents double charges when clients retry on network timeout.

### Reconciliation

Reconciliation is the process of ensuring your internal records match external records.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Internal    │     │  Bank/NPCI   │     │   Recon      │
│  Ledger     │────→│  Statement   │────→│   Engine     │
│  (your DB)  │     │  (external)  │     │  (comparator)│
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
                                    ┌───────────┼───────────┐
                                    ▼           ▼           ▼
                                 MATCHED    MISMATCH    ORPHAN
                                            (alert)    (investigate)
```

**Types of mismatches:**
- **Internal success, bank failure:** User charged but money not moved → refund needed
- **Internal failure, bank success:** Money moved but status shows failed → credit user
- **Orphan transactions:** Present in one system but not the other → investigate

### Settlement

Settlement is the actual movement of money between banks, distinct from the real-time
transaction.

- **T+0:** Real-time settlement (UPI provides this for most transactions)
- **T+1:** Next business day settlement (common for merchant payouts)
- **T+2/T+3:** Card transactions, especially cross-border

### Double-Entry Ledger

The gold standard for financial record-keeping. **Every fintech interview should
mention this.**

```sql
CREATE TABLE ledger_entries (
    id              BIGINT PRIMARY KEY,
    transaction_id  VARCHAR(36) NOT NULL,
    account_id      BIGINT NOT NULL,
    entry_type      ENUM('DEBIT', 'CREDIT') NOT NULL,
    amount          DECIMAL(19,4) NOT NULL,  -- NEVER use FLOAT for money
    currency        CHAR(3) NOT NULL DEFAULT 'INR',
    description     VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_txn (transaction_id),
    INDEX idx_account (account_id, created_at)
);

-- INVARIANT: For every transaction_id:
-- SUM(amount WHERE entry_type = 'DEBIT') = SUM(amount WHERE entry_type = 'CREDIT')
```

**Example — User pays merchant 500 INR:**

| transaction_id | account_id  | entry_type | amount |
| -------------- | ----------- | ---------- | ------ |
| txn_001        | user_wallet | DEBIT      | 500.00 |
| txn_001        | merchant_wallet | CREDIT | 500.00 |

If the SUM ever does not balance, something is critically wrong and must be investigated.

### PCI-DSS Compliance

If your design handles card data:
- Card numbers (PAN) must be encrypted at rest and in transit.
- Access to card data must be logged and audited.
- The cardholder data environment (CDE) must be network-segmented.
- **Tokenization:** Replace real card numbers with opaque tokens.
- Only PCI-DSS certified systems can touch raw card data.

### RBI Data Localization Mandate

Since October 2018, the RBI requires:
- All payment system data relating to Indian users must be stored **only in India**.
- Foreign payment processors (Visa, Mastercard) can process abroad but must delete
  data from foreign servers within 24 hours and store it domestically.
- This affects architecture decisions: no us-east-1 for your primary DB if you are
  handling Indian payment data.
- PhonePe and CRED both run their infrastructure in Indian data centers (AWS Mumbai,
  GCP Mumbai, or on-premise in Indian DCs).

### Exactly-Once Semantics for Money

True exactly-once delivery is impossible in distributed systems. Fintech achieves
the equivalent through:

```
Exactly-Once (for money) = At-Least-Once Delivery + Idempotent Processing
```

- Message queues deliver at-least-once → [[02_building_blocks/message_queues]]
- Every consumer is idempotent (checks if already processed before acting)
- Combined effect: money moves exactly once even with retries

---

## UPI Architecture Deep Dive

> This section exists because **every single fintech company in India** asks about UPI
> in system design rounds. If you are interviewing at PhonePe, GPay, Paytm, CRED,
> Razorpay, or any Indian fintech — know this cold.

### What is UPI?

**Unified Payments Interface (UPI)** is a real-time payment system developed by NPCI
(National Payments Corporation of India). It allows instant money transfer between
bank accounts through a mobile platform.

- Launched: April 2016
- Monthly transactions: 10B+ (as of 2024)
- Peak TPS: 10,000+ during festivals
- Settlement: Real-time (T+0) for most transactions

### UPI Ecosystem — Entities and Roles

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UPI ECOSYSTEM                                │
│                                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐  │
│  │  Payer   │     │  Payer   │     │   NPCI   │     │  Payee   │  │
│  │  (User)  │────→│   PSP    │────→│  Switch  │────→│   PSP    │  │
│  │          │     │ (PhonePe)│     │          │     │ (GPay)   │  │
│  └──────────┘     └────┬─────┘     └──────────┘     └────┬─────┘  │
│                        │                                  │        │
│                   ┌────▼─────┐                       ┌────▼─────┐  │
│                   │  Issuer  │                       │ Acquirer │  │
│                   │   Bank   │                       │   Bank   │  │
│                   │  (SBI)   │                       │  (HDFC)  │  │
│                   └──────────┘                       └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### VPA (Virtual Payment Address)

A VPA is the UPI equivalent of an email address for payments.

- Format: `username@handle`
- Examples: `rahul@ybl` (PhonePe), `rahul@okhdfcbank` (GPay via HDFC)
- The **handle** identifies the PSP: `@ybl` = PhonePe (Yes Bank), `@ibl` = PhonePe (ICICI)
- One user can have multiple VPAs across different PSPs
- VPA resolution: NPCI maps VPA → PSP → Bank Account

### UPI Transaction Flow — Pay Request (P2P)

This is the full flow when User A on PhonePe pays User B on GPay:

```
Step 1: User A enters User B's VPA and amount on PhonePe
Step 2: PhonePe sends PAY request to NPCI
Step 3: NPCI resolves User B's VPA to their PSP (GPay) and bank (HDFC)
Step 4: NPCI sends debit request to User A's bank (SBI — Issuer)
Step 5: SBI validates: sufficient balance, MPIN verification, account active
Step 6: SBI debits User A's account and responds SUCCESS to NPCI
Step 7: NPCI sends credit request to User B's bank (HDFC — Acquirer)
Step 8: HDFC credits User B's account and responds SUCCESS to NPCI
Step 9: NPCI sends final SUCCESS response to PhonePe
Step 10: PhonePe shows "Payment Successful" to User A
Step 11: GPay sends notification to User B — "You received ₹X"
```

### UPI Transaction Flow — Collect Request

Collect is the reverse — the payee **requests** money from the payer.

```
Step 1: Merchant on GPay creates COLLECT request for User A (PhonePe)
Step 2: GPay → NPCI → PhonePe: "Merchant is requesting ₹500 from User A"
Step 3: PhonePe shows notification to User A: "Merchant is requesting ₹500"
Step 4: User A approves with MPIN
Step 5: PhonePe → NPCI: User A approved the collect request
Step 6: Normal debit/credit flow proceeds (same as Pay request Steps 4-11)
```

### UPI Mandate (Recurring Payments)

UPI Mandate allows pre-authorized recurring debits:
- User sets up mandate: "Allow Netflix to debit up to ₹500 on the 1st of each month"
- First mandate requires explicit MPIN approval
- Subsequent debits (within approved amount and frequency) happen automatically
- Mandate can be revoked anytime by the user

### Handling Timeouts — The Hardest Part

The most critical engineering challenge in UPI is handling timeouts:

```
Scenario: PhonePe sends PAY request to NPCI. NPCI forwards to bank.
          Bank debits user's account but the response is lost due to
          network failure. PhonePe shows "Payment Pending."

What now?
1. PhonePe marks transaction as TIMED_OUT
2. PhonePe queries NPCI's Transaction Status API (TXN_STATUS)
3. If NPCI says SUCCESS → mark SUCCESS, notify user
4. If NPCI says FAILED → mark FAILED, notify user
5. If NPCI also timed out → wait and retry TXN_STATUS
6. If still unresolved after X retries → flag for manual reconciliation
7. EOD reconciliation job compares all TIMED_OUT txns with bank records
```

**This is the #1 thing to discuss in a UPI design interview.** Handling the unhappy
path is what separates senior candidates from junior ones.

---

## Sample Walkthrough — Design UPI Payment System

> This is the #1 most-asked question at PhonePe. Here is a complete walkthrough
> using [[07_interview_framework/the_four_step_framework]].

**Also see:** [[10_hld/examples/hld_upi_payment]] for additional depth.

### Step 1: Requirements and Scope (5 minutes)

**Functional Requirements:**
- User can send money to another user via VPA (P2P)
- User can pay a merchant via QR code or VPA (P2M)
- User can request money via collect request
- Transaction history and status tracking
- Support for multiple bank accounts per user

**Non-Functional Requirements:**
- **Consistency:** Transactions must be exactly-once (from money perspective)
- **Latency:** End-to-end payment < 3 seconds (p99)
- **Availability:** 99.99% (52 min downtime/year — fintech standard)
- **Throughput:** Handle 10,000 TPS during peak (Diwali, New Year)
- **Compliance:** RBI data localization, all data stored in India

**Scale Estimation:** (See [[07_interview_framework/estimation_cheat_sheet]])
- 500M registered users, 100M DAU
- 10B transactions/month ≈ 3,800 TPS average, 10,000+ TPS peak
- Each transaction record ≈ 1KB → 10TB/month of transaction data
- Need partitioning strategy for transaction tables

### Step 2: High-Level Design (15 minutes)

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  Mobile  │───→│   API        │───→│  Payment     │───→│   NPCI   │
│   App    │    │  Gateway     │    │  Service     │    │  Switch  │
└──────────┘    └──────────────┘    └──────────────┘    └──────────┘
                       │                    │                  │
                       ▼                    ▼                  ▼
                ┌──────────────┐    ┌──────────────┐    ┌──────────┐
                │   Auth       │    │  Transaction │    │  Banks   │
                │   Service    │    │     DB       │    │(Issuer/  │
                └──────────────┘    └──────────────┘    │Acquirer) │
                                           │            └──────────┘
                                           ▼
                                    ┌──────────────┐
                                    │  Ledger DB   │
                                    │(Double Entry)│
                                    └──────────────┘
```

**Core Services:**

| Service                | Responsibility                                        |
| ---------------------- | ----------------------------------------------------- |
| **API Gateway**        | Rate limiting, auth, routing, TLS termination          |
| **Auth Service**       | Device binding, MPIN verification, biometric auth      |
| **Payment Service**    | Orchestrates the payment flow, manages state machine   |
| **VPA Service**        | VPA resolution, creation, management                   |
| **NPCI Adapter**       | Translates internal protocol to UPI XML spec           |
| **Notification Service**| Push notifications, SMS for txn status                |
| **Reconciliation Service**| EOD recon, mismatch detection and resolution       |
| **Ledger Service**     | Double-entry bookkeeping, balance computation          |

### Step 3: Deep Dive (20 minutes)

**3a. Payment Flow — Happy Path**

```java
// Simplified payment orchestration
public PaymentResponse initiatePayment(PaymentRequest request) {
    // 1. Idempotency check
    Optional<Payment> existing = paymentRepo.findByIdempotencyKey(
        request.getIdempotencyKey()
    );
    if (existing.isPresent()) {
        return cached(existing.get());
    }

    // 2. Create payment record in CREATED state
    Payment payment = Payment.create(request);
    paymentRepo.save(payment);  // State: CREATED

    // 3. Validate: check limits, fraud score, account status
    validationService.validate(payment);
    payment.transitionTo(PaymentState.INITIATED);

    // 4. Send to NPCI
    NpciResponse response = npciAdapter.sendPayRequest(payment);

    // 5. Handle response
    switch (response.getStatus()) {
        case SUCCESS:
            payment.transitionTo(PaymentState.SUCCESS);
            ledgerService.createEntries(payment);  // Double-entry
            notificationService.notify(payment);
            break;
        case FAILED:
            payment.transitionTo(PaymentState.FAILED);
            notificationService.notify(payment);
            break;
        case TIMEOUT:
            payment.transitionTo(PaymentState.TIMED_OUT);
            reconService.enqueue(payment);  // For async resolution
            break;
    }

    return PaymentResponse.from(payment);
}
```

**3b. Database Schema**

```sql
-- Transactions table (partitioned by created_date)
CREATE TABLE transactions (
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_ref     VARCHAR(36) UNIQUE NOT NULL,   -- UUID
    idempotency_key     VARCHAR(64) UNIQUE NOT NULL,
    payer_vpa           VARCHAR(50) NOT NULL,
    payee_vpa           VARCHAR(50) NOT NULL,
    amount              DECIMAL(19,4) NOT NULL,
    currency            CHAR(3) DEFAULT 'INR',
    status              ENUM('CREATED','INITIATED','PROCESSING',
                             'SUCCESS','FAILED','TIMED_OUT',
                             'REFUND_INITIATED','REFUNDED') NOT NULL,
    npci_txn_id         VARCHAR(36),
    failure_reason      VARCHAR(255),
    created_at          TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP NOT NULL,

    INDEX idx_payer (payer_vpa, created_at),
    INDEX idx_payee (payee_vpa, created_at),
    INDEX idx_status (status, created_at)
) PARTITION BY RANGE (UNIX_TIMESTAMP(created_at));

-- State transition audit log
CREATE TABLE transaction_state_log (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    transaction_id  BIGINT NOT NULL,
    from_state      VARCHAR(30),
    to_state        VARCHAR(30) NOT NULL,
    reason          VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_txn (transaction_id)
);
```

See [[02_building_blocks/databases_sql]] for partitioning strategies.

**3c. Handling the Unhappy Path**

This is where you win the interview:

```
Timeout Handling:
1. Payment service sets a 30s timeout for NPCI response
2. On timeout → mark TIMED_OUT, publish to recon queue
3. Recon worker polls NPCI TXN_STATUS API every 30s (up to 5 retries)
4. If resolved → update state, notify user
5. If still unresolved after 5 retries → mark REQUIRES_MANUAL_RECON
6. EOD batch job: fetch bank statement, compare with all TIMED_OUT txns
7. Generate mismatch report for ops team

Duplicate Prevention:
1. Client generates idempotency_key before first attempt
2. On retry, sends same idempotency_key
3. Server checks: if key exists AND status is terminal → return cached result
4. If key exists AND status is non-terminal → return "in progress" status
5. If key does not exist → process normally
```

**3d. Scaling Considerations**

- **Database sharding:** Partition transactions by user_id hash for write distribution
- **Read replicas:** Transaction history reads go to replicas
- **Caching:** VPA resolution cached in Redis (TTL 5 min)
  → see [[05_case_studies/design_distributed_cache]]
- **Rate limiting:** Per-user and per-device rate limits
  → see [[05_case_studies/design_rate_limiter]]
- **Async processing:** Post-payment steps (notification, analytics, reward credit)
  are async via Kafka → [[02_building_blocks/message_queues]]

### Step 4: Wrap Up (5 minutes)

**Trade-offs discussed:**
- Chose strong consistency (ACID) over availability for payment path
- Chose async processing for non-critical paths (notifications, analytics)
- VPA cache has a staleness window (5 min TTL) — acceptable trade-off

**What we did not cover (acknowledge explicitly):**
- Detailed fraud detection pipeline
- Multi-currency support
- Cross-border payments
- Disaster recovery and multi-DC failover

**Monitoring and alerting:**
- Payment success rate dashboard (alert if drops below 95%)
- P99 latency per stage (alert if > 5s)
- NPCI timeout rate (alert if > 2%)
- Reconciliation mismatch count (alert if > 0.01%)

---

## Red Flags and Green Flags

### Red Flags (What Gets You Rejected)

| Red Flag                                           | Why It Hurts                              |
| -------------------------------------------------- | ----------------------------------------- |
| Using FLOAT/DOUBLE for money amounts               | Shows no fintech awareness                |
| No mention of idempotency                          | Critical gap in payment system design     |
| Using eventual consistency for payment status      | Money cannot be "eventually" correct      |
| No state machine for payments                      | Shows lack of domain understanding        |
| Ignoring failure scenarios and timeouts            | The easy path is easy; the hard path is what matters |
| Not knowing what NPCI is                           | If you are interviewing at an Indian fintech, know this |
| Storing card numbers in plain text                 | PCI-DSS violation, instant red flag       |
| Single point of failure in payment path            | Unacceptable for a financial system       |
| No mention of reconciliation                       | Every fintech person knows recon is essential |
| Saying "we can use MongoDB" for transactions       | Signals weak understanding of ACID needs  |

### Green Flags (What Gets You the Offer)

| Green Flag                                          | Why It Helps                              |
| --------------------------------------------------- | ----------------------------------------- |
| Mentions double-entry bookkeeping unprompted        | Shows deep fintech understanding          |
| Discusses RBI compliance and data localization      | India-specific awareness                  |
| Draws a proper payment state machine                | Shows you have built payment systems      |
| Handles timeout and pending states thoroughly       | The #1 differentiator                     |
| Uses DECIMAL(19,4) for money                        | Correct data type choice                  |
| Discusses reconciliation as part of the design      | Production-grade thinking                 |
| Mentions saga pattern for distributed transactions  | See [[03_design_patterns/saga_pattern]]   |
| Talks about idempotency key pattern with specifics  | Not just name-dropping but knows the impl |
| Discusses both happy path and failure modes         | Senior-level completeness                 |
| Knows the difference between PSP, issuer, acquirer  | UPI domain knowledge                      |

---

## Preparation Checklist

### Week 1: Fundamentals

- [ ] Read and understand [[01_fundamentals/acid_vs_base]]
- [ ] Read and understand [[01_fundamentals/consistency_models]]
- [ ] Study [[07_interview_framework/the_four_step_framework]] — internalize it
- [ ] Review [[07_interview_framework/estimation_cheat_sheet]] for back-of-envelope math
- [ ] Understand double-entry bookkeeping (read this guide's section thoroughly)
- [ ] Learn UPI architecture end-to-end (this guide's deep dive section)

### Week 2: Building Blocks and Patterns

- [ ] Study [[02_building_blocks/message_queues]] — Kafka is used heavily at both
- [ ] Study [[02_building_blocks/databases_sql]] — SQL is the default for fintech
- [ ] Learn [[03_design_patterns/saga_pattern]] — essential for distributed payments
- [ ] Learn [[03_design_patterns/event_sourcing]] — used for payment audit trails
- [ ] Learn [[03_design_patterns/distributed_locking]] — for concurrent transactions
- [ ] Practice: design a payment state machine on paper

### Week 3: Case Studies

- [ ] Work through [[10_hld/examples/hld_upi_payment]]
- [ ] Work through [[10_hld/examples/hld_payment_system]]
- [ ] Work through [[11_lld/examples/lld_splitwise]] (common PhonePe LLD)
- [ ] Study [[12_hld_lld_bridge/zoom_payment]] for HLD↔LLD bridge practice
- [ ] Work through [[05_case_studies/design_notification_system]] (webhook delivery)
- [ ] Work through [[05_case_studies/design_rate_limiter]] (fraud prevention)

### Week 4: Full Mock Interviews

- [ ] Mock 1: Design UPI Payment System (use the walkthrough in this guide)
- [ ] Mock 2: Design Wallet System with KYC limits
- [ ] Mock 3: Design Credit Card Bill Payment (CRED focus)
- [ ] Mock 4: Design Rewards Engine (CRED focus)
- [ ] Mock 5: Design Webhook Delivery System
- [ ] Review [[05_case_studies/design_distributed_cache]] for caching patterns
- [ ] Review [[05_case_studies/design_flash_sale]] — similar high-TPS challenges

### Ongoing: Domain Knowledge

- [ ] Read NPCI's UPI documentation (publicly available)
- [ ] Understand RBI data localization circular (October 2018)
- [ ] Know PCI-DSS basics (4 levels, 12 requirements summary)
- [ ] Follow PhonePe and CRED engineering blogs
- [ ] Practice explaining UPI flow in under 3 minutes (interviewer-friendly pace)

### Day Before the Interview

- [ ] Re-read this guide's "Fintech-Specific Patterns" section
- [ ] Practice drawing the UPI flow diagram from memory
- [ ] Review the state machine diagram — can you draw it without looking?
- [ ] Prepare 2-3 behavioral stories (production incidents, ownership, conflict)
- [ ] Verify you can explain double-entry bookkeeping with an example
- [ ] Sleep well — fintech interviews are long and detail-heavy

---

## Quick Reference Card

> Print this or keep it open before the interview.

```
FINTECH DESIGN MANTRAS:
1. Money must NEVER be wrong. Correctness > Availability.
2. ACID for payments. BASE is for social media, not banking.
3. Every debit has a credit. Double-entry. Always.
4. Idempotency key on every payment API. No exceptions.
5. State machine for every payment. Persist before proceeding.
6. Handle the timeout. That is where the interview is won.
7. Reconciliation is not an afterthought — it is part of the design.
8. DECIMAL(19,4) for money. NEVER FLOAT. NEVER DOUBLE.
9. Data stays in India. RBI said so. Architecture accordingly.
10. At-least-once + idempotent = exactly-once for money.
```

---

**See also:**
- [[10_hld/examples/hld_upi_payment]] — Full UPI Payment System HLD
- [[10_hld/examples/hld_payment_system]] — Generic Payment System HLD
- [[11_lld/examples/lld_splitwise]] — Splitwise LLD (common PhonePe question)
- [[03_design_patterns/saga_pattern]] — Distributed transaction pattern
- [[03_design_patterns/event_sourcing]] — Event sourcing for audit trails
- [[05_case_studies/design_notification_system]] — Webhook delivery system
- [[17_company_interview_guide/index]] — Back to company guide index
