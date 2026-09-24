# b03: NoSQL Databases — Partition by key to scale writes, and watch for the key everyone wants

Building blocks · b02 → **b03** → b04

> *"A good partition key spreads load; a hot one concentrates it"*
>
> **Concern**: scalability · availability

## The Problem

Your social app stores posts in PostgreSQL. Each post has different fields: some have images, some have polls, some have locations. Every new feature means another schema change. And the write volume has outgrown one machine: 60,000 writes a second against a node that handles 20,000, so it runs at 300%.

You do not need joins for this data, and you need more machines. That is what NoSQL trades for.

## The Idea

Instead of one rigid spreadsheet for everything, imagine different storage for different needs. A filing cabinet for documents, a lookup table for quick key access, a huge ledger for time-ordered data, a map of relationships.

The vault note groups NoSQL into four types:

- **Document** (MongoDB): flexible JSON-like records, easy to evolve.
- **Key-value** (Redis, DynamoDB): the fastest lookup by key.
- **Wide-column** (Cassandra): huge write volume, partitioned by key.
- **Graph** (Neo4j): relationships as first-class data.

What they share is a trade: you give up joins and strict schemas, and often strong consistency, to get horizontal scale and flexibility.

## How It Works

1. **Choose a partition key.** The database hashes it and assigns each key to a node, so data spreads without a central coordinator.
2. **Writes spread evenly** if keys are evenly used. Six nodes take 10,000 a second each: 50% utilization, and capacity grows by adding nodes.
3. **Reads by key go to one node.** Queries across keys (joins, ranges over other fields) are limited or expensive, so you model your data around the queries you need.
4. **Consistency is tunable** (the quorums from f08), and many NoSQL stores default to eventual consistency.

## When It Breaks

The hidden assumption is even use of keys. Real keys are not even: one celebrity, one viral post, one popular room. If 25% of writes hit a single key, the node that owns it takes 15,000 writes a second plus its share of the rest, and runs at 112.5% while the others are mostly idle. Adding nodes barely helps, because the hot key still lives on one of them: with twelve nodes it is still at 93.8%.

```js
// sim.mjs
  // The hot key's node carries the whole hot share plus its ordinary slice of the rest.
  const skewed = outcome(hot + rest / nodes, nodeRps, nodes, 1);
  const salted = outcome(hot / saltBuckets + rest / nodes, nodeRps, nodes, saltBuckets);
```

## The Trade-off

**Salting** splits a hot key into several sub-keys (`room42#0` to `room42#3`) so its writes land on different nodes. With four sub-keys the busiest node drops to 56.3%. The price is on the read side: reading that key now queries all four sub-keys and merges the results, so one read costs four queries.

More generally, NoSQL trades flexibility in queries for scale. You decide the access patterns up front, and a new kind of query may mean a new copy of the data.

## In The Wild

The Discord 2024 replay in the Practice tab is about hot partitions at very large message volume, the same failure at scale. The vault note also covers the tuning knobs of MongoDB, Cassandra and Redis, which mostly come down to picking a key that spreads load and matching the consistency level to the data.

## Try It

```sh
node course/3_building_blocks/b03_nosql/sim.mjs --nodes=12
```

You should see four frames. With twelve nodes the uniform frame drops to `busiestNodePct=25`, but the hot-key frame still reports `busiestNodePct=93.8`, and the salted frame `37.5  readQueriesPerRead=4`. Try `--hotSharePct=0` to see a perfectly even key.

## Say It In The Interview

1. Name the four types and one example of each.
2. Say when you would pick NoSQL: flexible schema, massive write scale, or simple key-based access.
3. Explain the partition key and the hot-key problem, with salting as a fix.
4. State the trade-off: no joins and weaker consistency in exchange for scale, so design around the queries.

## Boundary

This chapter covers partitioned NoSQL and hot keys. The SQL versus NoSQL decision is t03, sharding as a pattern is p03, and consistent hashing is p04.

## What's Next

Both kinds of database are slow compared with memory. How do you keep hot data close? That is b04, Caching.

## Source notes

- [NoSQL databases](../../../vault/system_design/02_building_blocks/databases_nosql.md)
