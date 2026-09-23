#system-design #interview-prep #company-guide

# Company-Wise System Design Interview Guide

> **Purpose:** Stop preparing generically. This guide tells you exactly what each company asks, how they evaluate, and how to answer for THEM.

---

## How to Use This Guide

1. **Identify your target company** from the table below
2. **Read that company's file** — it has everything: format, questions, patterns, walkthrough
3. **Cross-reference with case studies** — each file links to relevant [[05_case_studies/]] files
4. **Practice with the framework** — use [[07_interview_framework/the_four_step_framework]] for structure

---

## Quick Decision Matrix

### "I'm targeting a specific company"

| Company | File | Interview Style | Key Differentiator |
|---------|------|----------------|-------------------|
| Google | [[17_company_interview_guide/google\|Google]] | Open-ended, mathematical | Scalability + estimation obsession |
| Meta/Facebook | [[17_company_interview_guide/meta\|Meta]] | Product-focused, fast-paced | Social graph + real-time features |
| Amazon | [[17_company_interview_guide/amazon\|Amazon]] | LP-integrated design | Leadership Principles in EVERY answer |
| Stripe | [[17_company_interview_guide/stripe\|Stripe]] | Debug + integration | Clean code + API design mastery |
| Uber | [[17_company_interview_guide/uber\|Uber]] | Real-time systems | Geo-spatial + matching algorithms |
| Atlassian | [[17_company_interview_guide/atlassian\|Atlassian]] | Values-first design | Collaborative problem-solving |
| Microsoft | [[17_company_interview_guide/microsoft\|Microsoft]] | Pragmatic, breadth-focused | Azure ecosystem awareness |
| Flipkart | [[17_company_interview_guide/flipkart\|Flipkart]] | Machine coding + HLD | Java mandatory, LLD gatekeeper |
| PhonePe / CRED | [[17_company_interview_guide/phonepe_cred\|PhonePe/CRED]] | Fintech-specific | UPI architecture, compliance |
| Swiggy / Zomato | [[17_company_interview_guide/swiggy_zomato\|Swiggy/Zomato]] | Hyperlocal, India-scale | Delivery optimization, real-time |
| LinkedIn / Salesforce | [[17_company_interview_guide/linkedin_salesforce\|LinkedIn/Salesforce]] | Enterprise SaaS | Feed systems, multi-tenancy |
| Startups / Remote | [[17_company_interview_guide/startups_remote\|Startups/Remote]] | Practical, take-home | End-to-end ownership |

---

### "I don't know which company yet — help me decide"

#### By Compensation (India, 2024-2025)

| Tier | Companies | SDE-2 Range | SDE-3/Senior Range |
|------|-----------|-------------|-------------------|
| **Tier 1 Global** | Google, Meta, Apple | ₹45-80 LPA | ₹80-1.5 Cr |
| **Tier 1 Product** | Stripe, Uber, Atlassian | ₹40-70 LPA | ₹70-1.2 Cr |
| **Tier 1 India** | Flipkart, PhonePe, CRED | ₹30-50 LPA | ₹50-1 Cr |
| **Tier 2 India** | Swiggy, Zomato, Razorpay | ₹25-45 LPA | ₹45-80 LPA |
| **Remote Global** | Stripe, GitLab, Automattic | $100-180K USD | $150-250K USD |

#### By Interview Difficulty

| Difficulty | Companies | What Makes It Hard |
|-----------|-----------|-------------------|
| **Hardest** | Google, Stripe | Mathematical depth, clean code bar |
| **Hard** | Meta, Amazon, Uber | Speed + breadth required |
| **Moderate** | Flipkart, Microsoft, Atlassian | Structured but thorough |
| **Accessible** | Swiggy, Zomato, Startups | Domain-focused, less abstract |

#### By Your Strength

| If You're Strong In... | Target These Companies |
|----------------------|----------------------|
| DSA + Math | Google, Meta |
| System Design + Scale | Amazon, Uber, Flipkart |
| Clean Code + APIs | Stripe, CRED |
| Product Thinking | Meta, Atlassian |
| Domain (Fintech) | PhonePe, Razorpay, CRED |
| Domain (E-commerce) | Flipkart, Amazon |
| Domain (Food/Delivery) | Swiggy, Zomato, Uber |
| Java + LLD | Flipkart, Swiggy, PhonePe |

---

## Preparation Timeline

### 3 Months Before Interview

| Week | Focus | Resources |
|------|-------|-----------|
| 1-2 | Fundamentals refresh | [[01_fundamentals/]] — all 8 files |
| 3-4 | Building blocks mastery | [[02_building_blocks/]] — all 11 files |
| 5-6 | Design patterns | [[03_design_patterns/]] — all 13 files |
| 7-8 | Case studies (enhanced) | [[05_case_studies/]] — 11 enhanced files |
| 9-10 | Company-specific prep | This folder — your target company file |
| 11-12 | Mock interviews + review | [[07_interview_framework/]] + practice |

### 1 Month Intensive

| Week | Focus |
|------|-------|
| 1 | Read your company file + all linked case studies |
| 2 | Practice top 5 questions with timer (45 min each) |
| 3 | Mock interviews (use [[07_interview_framework/the_four_step_framework]]) |
| 4 | Review red flags, polish communication, rest |

---

## Cross-Reference: Question → Company → Case Study

### Most Common Questions Across Companies

| Question | Companies That Ask It | Case Study |
|----------|---------------------|------------|
| URL Shortener | Google (L3), Amazon (SDE-1), Meta (E3) | [[05_case_studies/design_url_shortener]] |
| Rate Limiter | Stripe, Amazon, Google | [[05_case_studies/design_rate_limiter]] |
| Chat/Messaging | Meta (E4+), Microsoft, Flipkart | [[05_case_studies/design_chat_system]] |
| Notification System | Amazon, Flipkart, Swiggy | [[05_case_studies/design_notification_system]] |
| News Feed / Timeline | Meta (E5+), LinkedIn, Twitter | [[05_case_studies/design_twitter]] |
| Ride Sharing | Uber (#1), Ola, Google | [[05_case_studies/design_ride_sharing]] |
| Video Streaming | Netflix, YouTube, Meta | [[05_case_studies/design_video_streaming]] |
| Search Autocomplete | Google (#1), Amazon, Flipkart | [[05_case_studies/design_search_autocomplete]] |
| Google Maps | Google (L5+), Uber | [[05_case_studies/design_google_maps]] |
| Google Docs | Google (L5+), Microsoft | [[05_case_studies/design_google_docs]] |
| Music Streaming | Spotify, Amazon, Apple | [[05_case_studies/design_spotify]] |
| Instagram Stories | Meta (E4+), Snap | [[05_case_studies/design_instagram_stories]] |
| Flash Sale | Flipkart, Amazon (India) | [[05_case_studies/design_flash_sale]] |
| Ticket Booking | BookMyShow, IRCTC | [[05_case_studies/design_ticketmaster]] |
| Web Crawler | Google, Amazon | [[05_case_studies/design_web_crawler]] |
| Distributed Cache | Amazon, Google, Microsoft | [[05_case_studies/design_distributed_cache]] |
| Key-Value Store | Amazon (DynamoDB), Google | [[05_case_studies/design_key_value_store]] |
| Logging System | Amazon, Uber, Stripe | [[05_case_studies/design_logging_system]] |
| Pastebin | Google (L3), warm-up question | [[05_case_studies/design_pastebin]] |
| Zoom/Video Calling | Microsoft (Teams), Google (Meet) | [[05_case_studies/design_zoom]] |

---

## The Same Question, Different Emphasis

> This is the KEY insight: companies ask the same question but evaluate completely differently.

### Example: "Design a Notification System"

| Company | What They Really Want |
|---------|---------------------|
| **Amazon** | "Show me you think about operational excellence. How do you handle 10B notifications/day? What's your retry strategy? How do you monitor delivery rates?" + tie to LP: Dive Deep, Ownership |
| **Google** | "Give me the math. What's your QPS? How do you shard? What's the consistency model? Show me you can estimate capacity." |
| **Meta** | "Think about the product. How does this integrate with Facebook, Instagram, WhatsApp? What's the user experience for notification preferences?" |
| **Flipkart** | "India-specific: How do you handle SMS vs push in tier-3 cities? What about low-end Android devices with limited RAM? Regional language support?" |
| **Stripe** | "Show me the API. What does the webhook contract look like? How do you handle idempotency? What's the retry policy with exponential backoff?" |

---

## Common Mistakes by Company Type

### FAANG Mistakes
- ❌ Jumping to solution without requirements gathering
- ❌ Not doing back-of-envelope estimation
- ❌ Ignoring trade-offs ("I'll just use Kafka" — why?)
- ❌ Not discussing monitoring/alerting

### Indian Product Company Mistakes
- ❌ Writing pseudocode instead of real Java code (LLD rounds)
- ❌ Ignoring India-specific constraints (UPI, COD, network quality)
- ❌ Not knowing SOLID principles with examples
- ❌ Over-designing when they want working code

### Startup Mistakes
- ❌ Over-engineering for scale they don't have
- ❌ Not considering cost (they care about AWS bills)
- ❌ Missing practical considerations (deployment, monitoring)
- ❌ Not showing end-to-end ownership

---

## Related Vault Sections

| Section | What It Covers | When to Use |
|---------|---------------|-------------|
| [[05_case_studies/]] | 20 system design solutions | Deep-dive into specific problems |
| [[07_interview_framework/]] | 4-step framework, estimation | How to structure ANY answer |
| [[10_hld/]] | High-level design patterns | HLD round preparation |
| [[11_lld/]] | Low-level design patterns | LLD round preparation (Indian companies) |
| [[12_hld_lld_bridge/]] | HLD↔LLD connection | Understanding full-stack design |
| [[13_interview_prep/]] | General interview strategy | Broad preparation |
| [[08_reference/]] | Cheat sheets, numbers | Quick review before interview |

---

## File Index

| # | File | Target | Lines |
|---|------|--------|-------|
| 1 | [[17_company_interview_guide/google\|google.md]] | Google L3-L5 | ~800 |
| 2 | [[17_company_interview_guide/meta\|meta.md]] | Meta E3-E5 | ~800 |
| 3 | [[17_company_interview_guide/amazon\|amazon.md]] | Amazon SDE-1/2/3 | ~800 |
| 4 | [[17_company_interview_guide/stripe\|stripe.md]] | Stripe SWE | ~800 |
| 5 | [[17_company_interview_guide/uber\|uber.md]] | Uber SWE | ~600 |
| 6 | [[17_company_interview_guide/atlassian\|atlassian.md]] | Atlassian P1-P3 | ~600 |
| 7 | [[17_company_interview_guide/microsoft\|microsoft.md]] | Microsoft SDE/Senior | ~600 |
| 8 | [[17_company_interview_guide/flipkart\|flipkart.md]] | Flipkart SDE-1/2/3 | ~700 |
| 9 | [[17_company_interview_guide/phonepe_cred\|phonepe_cred.md]] | PhonePe/CRED | ~600 |
| 10 | [[17_company_interview_guide/swiggy_zomato\|swiggy_zomato.md]] | Swiggy/Zomato | ~600 |
| 11 | [[17_company_interview_guide/linkedin_salesforce\|linkedin_salesforce.md]] | LinkedIn/Salesforce | ~500 |
| 12 | [[17_company_interview_guide/startups_remote\|startups_remote.md]] | Startups/Remote | ~500 |
| 13 | [[17_company_interview_guide/index\|index.md]] | This file | ~300 |

---

*Created as part of the System Design vault. Cross-references [[13_interview_prep/company_question_bank]] for question lists and [[13_interview_prep/faang_preparation]] for general FAANG strategy.*
