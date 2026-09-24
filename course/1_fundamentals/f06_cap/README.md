# f06: CAP Theorem — When the network splits, you choose between correct and available

Fundamentals · f05 → **f06** → f07

> *"Partitions are not optional, so choose how you fail"*
>
> **Concern**: availability · consistency

## The Problem

Your database runs across two data centers. A brief network fault cuts the link between them. Users in one data center now see different data from users in the other. Do you serve whatever each side has (available but possibly wrong), or refuse requests until the sides can agree (correct but unavailable)?

This happened to GitHub in 2018. A routine 43-second network maintenance disconnected the primary database from its replicas. The failover tool decided the primary had failed and promoted a remote replica. When the network came back, both sides had accepted writes. It took about 24 hours to reconcile the data.

## The Idea

Three librarians in different cities keep identical catalogs. When someone adds a book, do you wait until all three have recorded it (consistent, but stuck if one city is unreachable), or record it at whichever librarian you can reach and let the others catch up (available, but for a while they disagree)?

CAP names three properties:

- **Consistency**: every read sees the most recent write, or gets an error.
- **Availability**: every request gets a non-error response.
- **Partition tolerance**: the system keeps working when messages between nodes are lost.

A distributed system will have partitions, because hardware fails and cables break. So P is not optional, and the real choice is C or A **while a partition lasts**.

## How It Works

1. **A partition splits the replicas.** Here, two replicas keep a majority and a third is cut off with a third of the clients.
2. **CP (consistent, not available)**: the small side cannot confirm it has the latest data, so it refuses requests.
3. **AP (available, not consistent)**: both sides keep answering from what they have, and the data diverges.
4. **You can choose per feature**: money must be correct, likes can be late.

```js
// sim.mjs
  const cp = outcome(1 - minority, total * minority, 0);
  const ap = outcome(1, 0, minority * changed);
  const mixed = outcome(1 - minority * critical, total * minority * critical, minority * (1 - critical) * changed);
```

## When It Breaks

Under CP, availability drops to 67% and 3,960 requests are rejected over a 60-second split, all of them correct refusals but errors to users nonetheless.

Under AP, nobody sees an error but about 9.9% of reads are stale, because the small side missed the big side's writes. After the split heals, the two sides must reconcile. GitHub's 24 hours were spent doing exactly this by hand: working out which writes had happened where and merging them without losing any.

## The Trade-off

Treat the 20% of traffic that must be correct (payments, inventory) as CP and the rest (feeds, likes) as AP. The sim gives 93.4% availability and 7.9% stale reads, instead of giving up one property for everything. Most real systems end up here.

CAP also only describes the partition. Even when the network is healthy there is a trade-off between latency and consistency, which is why the fuller PACELC form exists. That belongs to t01.

## In The Wild

The vault note classes etcd, ZooKeeper and HBase as CP: they stop rather than guess. It classes Cassandra, DynamoDB and DNS as AP: they answer and reconcile later. A single-node PostgreSQL is neither, because it has no partition to survive.

## Try It

```sh
node course/1_fundamentals/f06_cap/sim.mjs --minorityPct=10
```

You should see four frames. With only 10% of clients cut off, the CP frame reports `availabilityPct=90  rejectedRequests=1200` and the AP frame reports `staleReadsPct=3`. Try `--changedKeysPct=100` to see AP get worse when more data changes during the split.

## Say It In The Interview

1. State CAP precisely: during a partition you choose consistency or availability. Partition tolerance is not a choice.
2. Give examples of each: etcd and ZooKeeper are CP, Cassandra and DynamoDB are AP.
3. Say it is per feature: money needs CP, feeds can be AP.
4. Mention that after an AP split you must reconcile, and how you would (last-write-wins, merges, or a human).

## Boundary

This chapter covers the trade-off during a partition. The spectrum of consistency models is f08, and choosing between consistency and availability as a design decision is t01.

## What's Next

Some data needs all-or-nothing guarantees even without a partition. What do ACID and BASE promise? That is f07.

## Source notes

- [CAP theorem](../../../vault/system_design/01_fundamentals/cap_theorem.md)
