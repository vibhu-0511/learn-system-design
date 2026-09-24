# f07: ACID vs BASE — Some data needs all-or-nothing, and some can wait to agree

Fundamentals · f06 → **f07** → f08

> *"Match the guarantee to the data"*
>
> **Concern**: consistency · latency

## The Problem

User A sends $100 to user B. Your system takes $100 from A, then crashes before it credits B. The money has vanished, and nothing in the system knows. At 10,000 transfers with 2 crashes per thousand, 20 transfers break and $1,000 disappears.

You could enforce strict all-or-nothing rules on everything to make sure this never happens. But if you do that for every like, view and comment too, you pay in speed and availability for data that never needed it.

## The Idea

**ACID** is a bank transfer: the money moves completely or not at all, with no half-states. **BASE** is a social media post: it may take a few seconds to reach every follower, but it gets there.

ACID describes a transaction:

- **Atomicity**: all the steps happen, or none do.
- **Consistency**: the database's rules (constraints) are never violated.
- **Isolation**: concurrent transactions do not see each other's half-finished work.
- **Durability**: once committed, the data survives a crash.

BASE stands for **B**asically **A**vailable, **S**oft state, **E**ventually consistent: keep answering, accept that replicas disagree for a while, and expect them to converge.

## How It Works

1. **Group the steps into a transaction.** Debit and credit are one unit.
2. **A crash mid-transaction rolls back.** The database uses a write-ahead log to undo the half-finished work, so the books balance. The failed transfer is simply retried.
3. **The guarantee costs throughput**, because of locking and logging. The sim charges 30%.

```js
// sim.mjs
  const acid = outcome(acidTps, 0, crashes, 0);
  const unsafe = outcome(BASE_TPS, crashes * avgDollars, 0, 0);
  const base = outcome(BASE_TPS, 0, 0, replicaLagSec);
```

With a transaction, the 20 crashes are rolled back and retried, so $0 is lost and throughput falls from 1,000 to 700 transfers a second.

## When It Breaks

Two separate writes with no transaction: debit, then credit. A crash between them leaves the money gone, and the 20 crashes lose $1,000. Nothing crashes visibly and nothing alerts, so the loss is found later in a reconciliation, if at all.

Transactions also get harder when the data lives on more than one machine. Coordinating a commit across services needs protocols like two-phase commit or sagas (p19), and each one adds failure modes of its own.

## The Trade-off

Relax to BASE for data that tolerates it. A like counter needs no transaction: it runs at the full 1,000 a second, served from replicas that may be 3 seconds behind. A few seconds of staleness on a like count is invisible. On an account balance it is a bug.

The rule of thumb: money, inventory and anything you cannot repeat get ACID. Feeds, counters and recommendations get BASE.

## In The Wild

Most real systems are hybrids. The vault note describes the common shape: a relational database with ACID transactions holds orders and payments, while eventually consistent stores hold feeds, counters and caches that can lag.

## Try It

```sh
node course/1_fundamentals/f07_acid_base/sim.mjs --crashesPer1000=10
```

You should see four frames. With 10 crashes per thousand there are 100 crashes: the transaction frame reports `rolledBack=100  lostDollars=0`, and the unsafe frame reports `lostDollars=5000`. Try `--acidOverheadPct=80` to see when the transaction's cost starts to hurt.

## Say It In The Interview

1. Define ACID with a bank transfer, one property at a time, and BASE with a social post.
2. Say the split: ACID for money and inventory, BASE for feeds and counters.
3. Name the cost: transactions reduce throughput and are hard across machines.
4. Mention how atomicity works: a write-ahead log to roll back, and sagas or two-phase commit across services.

## Boundary

This chapter covers what the guarantees are and what they cost. Isolation levels, distributed transactions and sagas are p19, and the write-ahead log is p05.

## What's Next

"Eventually consistent" is a range, not one thing. What are the levels between strict and eventual? That is f08, Consistency Models.

## Source notes

- [ACID vs BASE](../../../vault/system_design/01_fundamentals/acid_vs_base.md)
