# e01: Scaling a Web App — A ladder of bottlenecks, where each rung adds one building block

Evolutions · f08 → **e01** → e02

> *"Add the next block only when the last one breaks"*
>
> **Concern**: scalability · cost

## The Problem

Your product has 4,000 requests a second at peak, and one server handles 1,000. The app tier runs at 400% and the database, sharing that machine, is at 80%. Every fix has a price, and the wrong fix at the wrong time is expensive: a cache before you need one is one more thing to run, and a shard before you need one is a permanent tax.

This chapter is the map for the whole course. It grows one web app and names the block that fixes each bottleneck, and later chapters take each block apart.

## The Idea

Growing a web app is like growing a restaurant. You start as one person in a food truck (a single server). As customers arrive you split the kitchen from the counter, add more cooks, put popular dishes under a heat lamp (a cache), and eventually open more locations. Each step fixes today's bottleneck and creates tomorrow's.

The vault note lays the ladder out in ten stages, with rough prices and the signal to climb to the next one:

| Stage | Users | Add | Cost a month | Climb when |
|---|---|---|---|---|
| 1 | 0–100 | Single server | $20 | CPU above 80% |
| 2 | 100–1K | Separate database | $40 | App CPU above 90% |
| 3 | 1K–10K | Load balancer, more app servers | $120 | Database overloaded |
| 4 | 10K–50K | Cache | $200 | Database queries high |
| 5 | 50K–200K | Read replicas | $400 | Read bottleneck |
| 6 | 200K–500K | CDN | $600 | Bandwidth cost |
| 7 | 500K–2M | Shard the database | $1.2K | Write overload |
| 8 | 2M–5M | Message queue | $2K | Blocking tasks |
| 9 | 5M–20M | Microservices | $5K | Monolith pain |
| 10 | 20M+ | Multi-region | $20K+ | Global latency |

The sim models the middle of the ladder: the load balancer, the cache and read replicas.

## How It Works

1. **Size the app tier.** With about 1,000 requests a second per server and a target of 70% utilization, 4,000 requests need 6 servers behind a load balancer.
2. **Put a cache in front of the database.** With a 95% hit rate only the writes and the missed reads reach it: 580 queries a second, 11.6% of the database.
3. **Price the stack.** Six servers, a load balancer, a cache and a database come to $500 a month:

```js
// sim.mjs
  const servers = serversFor(peakRps);
  const stackCost = (n, extraReplicas = 0) => n * COST.server + COST.loadBalancer + COST.cache + COST.database * (1 + extraReplicas);
```

4. **Watch which tier goes next.** Each block moved the bottleneck, it did not remove it.

## When It Breaks

Traffic grows ten times to 40,000 requests a second. The six servers run at 666.7% and the database at 116%: both tiers are over capacity. Adding app servers is easy because they are stateless (f01). The database is the hard one, because it holds state.

## The Trade-off

Read replicas take the cache misses off the primary. In the sim at 10x traffic that needs 58 app servers and 2 replicas, $2,460 a month, five times the $500 stack. The primary now only takes writes (80%) and the replicas sit at 18%. Two prices come with it: reads can be 100 ms behind the primary, and writes are still one machine's problem.

At 8,000 requests a second the same setup shows the primary at 160% even with replicas, because at 10x the writes alone exceed one database. That is the signal for the next rung, sharding, which is the next chapter.

## In The Wild

The vault note traces Twitter's timeline and Reddit's growth through this same ladder: each step added the block that fixed the current bottleneck and exposed the next one. The stage numbers are heuristics, not laws. A read-heavy app may need caching at 1,000 users, and a write-heavy one may shard early.

## Try It

```sh
node course/2_evolutions/e01_scaling_web_app/sim.mjs --peakRps=8000
```

You should see four frames. The stack frame reports `appServers=12  dbUtilizationPct=23.2  monthlyCostUsd=680`, and the last frame reports `dbUtilizationPct=160` even with replicas. Try `--hitRatePct=70` to see how much the cache hit rate matters.

## Say It In The Interview

1. Start simple and name each block by the bottleneck it fixes: LB for app CPU, cache for read load, replicas for read scale, sharding for writes, queues for slow work.
2. Give the order and the triggers, not just a diagram.
3. Do the numbers: peak traffic, read and write split, hit rate, and which tier saturates first.
4. Say what each step costs: money, staleness and complexity.

## Boundary

This chapter is the map. Each block gets its own chapter: b01 load balancers, b04 caching, p02 replication, p03 sharding, b05 queues, e04 microservices. The database ladder in detail is e02.

## What's Next

Reads scaled out. Writes did not. How do you scale a database that people write to? That is e02.

## Source notes

- [Scaling a web app](../../../vault/system_design/04_system_evolutions/scaling_a_web_app.md)
