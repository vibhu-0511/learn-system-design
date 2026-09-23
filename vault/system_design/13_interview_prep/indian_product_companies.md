#system-design #interview #india

# Indian Product Companies — Interview Preparation

---

## Company Profiles & What They Test

### Tier 1: Flipkart, Swiggy, Zomato, PhonePe, Razorpay

**Format:** 1-2 system design rounds (45-60 min each), 1-2 LLD rounds (Java preferred), 2 DSA rounds

**HLD Focus:**
- Problems directly related to their domain
- India-specific scale and constraints (UPI, COD, regional languages)
- Expect back-of-envelope estimation
- Deep dive into one component

**LLD Focus:**
- Java mandatory (Spring Boot ecosystem)
- SOLID principles — they WILL ask you to explain with examples
- Design patterns — expect to implement Strategy, Observer, Factory
- Working code expected (not pseudocode)

| Company | Likely HLD Questions | Likely LLD Questions |
|---------|---------------------|---------------------|
| **Flipkart** | Design Flipkart search, Design inventory management, Design cart/checkout | Design parking lot, Design shopping cart, Design notification system |
| **Swiggy** | Design food delivery, Design restaurant search, Design real-time tracking | Design order management, Design delivery assignment, Design rate limiter |
| **Zomato** | Design restaurant listing, Design food ordering, Design review system | Design restaurant search LLD, Design menu management |
| **PhonePe** | Design UPI payment, Design wallet, Design transaction history | Design payment processor, Design splitwise, Design ledger |
| **Razorpay** | Design payment gateway, Design subscription billing, Design webhook delivery | Design idempotent service, Design state machine for payments |

---

### Tier 2: CRED, Ola, Paytm, Zerodha, Meesho, Urban Company

| Company | Domain Focus | Unique Questions |
|---------|-------------|-----------------|
| **CRED** | Fintech, gamification | Design reward points system, Design credit score tracker |
| **Ola** | Ride-sharing | Design Uber/Ola, Design surge pricing, Design driver matching |
| **Paytm** | Payments, mini-apps | Design wallet, Design QR payment, Design cashback system |
| **Zerodha** | Stock trading | Design order matching engine, Design portfolio tracker, Design real-time price feed |
| **Meesho** | Social commerce | Design reseller platform, Design catalog management |
| **Urban Company** | On-demand services | Design service booking, Design professional matching |

---

## India-Specific Topics to Prepare

| Topic | Why It Matters |
|-------|---------------|
| **UPI architecture** | Every fintech company asks about it |
| **Cash on delivery** | E-commerce + food delivery companies |
| **Regional language support** | i18n/l10n for 22+ languages |
| **Aadhaar/KYC integration** | Fintech companies |
| **Variable network quality** | Offline-first design, lightweight apps |
| **Tier-2/3 city scaling** | Different infra assumptions than Bangalore/Mumbai |
| **RBI compliance** | Payment data localization, transaction limits |

---

## Preparation Strategy (8 Weeks)

```
Week 1-2: Fundamentals + Building Blocks (from this vault)
Week 3-4: Design Patterns in Java + SOLID + LLD examples
Week 5:   HLD framework + 3-4 HLD examples (including India-specific)
Week 6:   Company-specific practice (pick target company, do their likely questions)
Week 7:   Mock interviews (find a peer, alternate interviewer/candidate)
Week 8:   Review weak areas, re-do hardest problems
```

## Salary Expectations (2024-2025)

| Level | Flipkart/Swiggy/PhonePe | CRED/Razorpay |
|-------|------------------------|---------------|
| SDE-1 (0-2 yrs) | ₹18-28 LPA | ₹20-35 LPA |
| SDE-2 (2-5 yrs) | ₹30-50 LPA | ₹35-60 LPA |
| SDE-3 (5-8 yrs) | ₹50-80 LPA | ₹60-100 LPA |
| Staff/Principal | ₹80-1.2 Cr | ₹1-1.5 Cr |

## Links

- [[company_question_bank]] — Specific questions by company
- [[../10_hld/examples/hld_food_delivery]] — Swiggy/Zomato HLD
- [[../10_hld/examples/hld_upi_payment]] — PhonePe/Razorpay HLD
- [[../10_hld/examples/hld_ticket_booking]] — BookMyShow HLD
