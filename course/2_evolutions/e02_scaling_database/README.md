# e02: Scaling a Database — Reads scale out; writes need to be split

Evolutions · e01 → **e02** → e03

> *"Replicas cure read pain and do nothing for writes"*
>
> **Concern**: scalability · consistency

## The Problem

On day 1 you have 100 users and one database node, and it responds in 50 ms. On day 90 you have 50,000 users and the same node. Logins take 8 seconds, dashboards time out, and the database is at 100% CPU with its connections used up. You optimized the code and never scaled the database.

In the sim the load is 12,000 reads and 2,000 writes a second against a node that handles 5,000, so it runs at 280%.

## The Idea

Database scaling is a restaurant expanding. Start with one chef (a single node). Add waiters to manage the flow of orders (connection pooling), train assistant chefs to help with prep (read replicas), install a heating lamp for popular dishes (a cache), buy bigger equipment (vertical scaling), and finally open more locations (sharding) when one building cannot hold any more.

The vault note walks nine stages, cheapest first: indexes and better queries, connection pooling, read replicas, a cache, a bigger machine, table partitioning, sharding, and finally different databases for different jobs. Each one is more powerful and more expensive to operate than the last, so stop at the first one that solves the problem.

## How It Works

1. **A read replica is a copy.** The primary takes all writes and streams them to replicas, and reads spread across the replicas.
2. **Reads scale with replicas.** With 3 replicas, the primary keeps only the 2,000 writes (40%) and each replica takes a third of the reads (80%).
3. **Replicas lag.** A write reaches a replica a moment later, and the lag grows as the primary gets busier:

```js
// sim.mjs
const lagFor = (primaryUtil) => (primaryUtil >= 1 ? LAG_CAP_MS : round1(LAG_BASE_MS + 100 * primaryUtil));
```

At 40% the lag is 60 ms, so a user who writes and immediately reads from a replica might not see their own change.

## When It Breaks

Writes grow four times, from 2,000 to 8,000 a second. Every write must go through the single primary, so it runs at 160% and replication lag hits its 5-second ceiling. Adding more replicas does nothing, because replicas only help reads. A vertical upgrade buys time but has a limit. The only way to scale writes past one machine is to split the data.

## The Trade-off

**Sharding** splits the data across nodes, each owning a slice. With 6 shards the writes divide six ways, and the busiest node runs at 86.7%.

The price is queries that need more than one shard. If 10% of reads touch every shard, each one costs 6 queries instead of 1, which adds 50% more read queries overall, and joins and transactions across shards become hard:

```js
// sim.mjs
  // A cross-shard read asks every shard, so it costs `shards` queries instead of one.
  const fanOut = (crossShardPct / 100) * (shards - 1);
  const shardLoad = (grownWrites + readRps * (1 + fanOut)) / shards;
```

Choosing the shard key well, so most queries hit one shard, matters more than the number of shards.

## In The Wild

The vault note follows Instagram (over 100 PostgreSQL shards), Pinterest, and Discord's move to a different database as message volume outgrew the old one. In every case the first fixes were cheap (indexes, replicas, caches) and sharding came last.

## Try It

```sh
node course/2_evolutions/e02_scaling_database/sim.mjs --replicas=6
```

You should see four frames. With 6 replicas the replica frame drops to `busiestNodePct=40`, but the writes-grow frame still reports `busiestNodePct=160  replicationLagMs=5000`, because more replicas do not help writes. Try `--crossShardPct=50` to see fan-out eat the benefit of sharding.

## Say It In The Interview

1. Go cheapest first: query tuning and indexes, pooling, replicas, cache, then vertical scaling, then sharding.
2. Say reads scale with replicas and writes need sharding or a bigger primary.
3. Name replica lag and its consequence: read-your-writes can break.
4. Name the sharding costs: cross-shard queries, joins, transactions and a hard-to-change shard key.

## Boundary

This chapter is the ladder. Replication itself is p02, sharding is p03, indexes are p01, and the trade-off between SQL and NoSQL is t03.

## What's Next

Databases are not the only thing that needs its own scaling story. How does a real-time chat system evolve from polling to millions of connections? That is e03.

## Source notes

- [Scaling a database](../../../vault/system_design/04_system_evolutions/scaling_a_database.md)
