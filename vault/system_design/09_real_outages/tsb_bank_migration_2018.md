#system-design #outage #migration #finance

# TSB Bank Migration Disaster (2018)

## What Happened

In April 2018, TSB Bank (UK) migrated 5.4 million customer accounts from their old Lloyds Banking Group platform to a new system built by Sabadell (their parent company). The migration went catastrophically wrong. **1.9 million customers locked out** of their accounts for weeks. Some could see OTHER customers' accounts and balances.

## The Chain of Events

1. TSB planned a "big bang" migration — move all 5.4M accounts in one weekend
2. Migration completed Sunday night, systems went live Monday morning
3. Customers couldn't log in. Mobile app crashed. Website errors.
4. **Worst:** Some customers could see other people's accounts, balances, and transactions
5. TSB's customer service lines overwhelmed — 2-hour hold times
6. Fraud spiked — criminals exploited the chaos to steal from exposed accounts
7. The issues persisted for **weeks**, some for months
8. CEO Paul Pester resigned
9. **Cost: £366M** in direct costs + regulatory fines + customer compensation

## Root Cause

- **Big bang migration** instead of gradual/parallel cutover
- Insufficient load testing — couldn't handle real production traffic
- No rollback plan — couldn't revert to old system
- Data mapping errors between old and new schemas
- Security failures — account data crossed between users

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Never do big-bang migrations** — use strangler fig pattern | [[04_system_evolutions/from_monolith_to_microservices]] |
| **Parallel run:** keep old system running alongside new | Migration safety |
| **Rollback plan is mandatory** — if migration fails, revert instantly | Deployment safety |
| **Load test with production-scale data** before migrating | Load testing |
| **Data isolation is non-negotiable** — one user must NEVER see another's data | Security |
| Gradual migration: 1% → 10% → 50% → 100% | Canary deployment |

## The Key Takeaway

For any critical migration: run both systems in parallel, migrate gradually (1% → 10% → 100%), have a rollback button, and load test at production scale. TSB violated every one of these principles.

## Links
- [[04_system_evolutions/from_monolith_to_microservices]] — Strangler fig pattern
- [[09_real_outages/knight_capital_2012]] — Another big-bang deployment disaster
