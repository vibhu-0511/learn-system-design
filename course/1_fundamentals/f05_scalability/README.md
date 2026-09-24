# f05: Scalability — Scaling out buys capacity until the serial work says stop

Fundamentals · f04 → **f05** → f06

> *"Adding servers is not the same as adding capacity"*
>
> **Concern**: scalability · cost

## The Problem

Your app is featured on a launch site. Yesterday it had 100 users. Today 8,000 requests a second arrive, and your one server handles 500. Its CPU is pinned, response times climb from 200 ms to many seconds, and the database runs out of connections.

The obvious fix is more servers. The less obvious question is how much capacity each new server actually adds.

## The Idea

You can carry more freight with a bigger truck (**vertical scaling**, or scaling up) or with more trucks (**horizontal scaling**, or scaling out). A bigger truck needs no new roads but eventually you cannot buy a bigger one. More trucks have no ceiling but need dispatch, and they help only if the freight can be split.

That last part is the catch. Some work is **serial**: one database everyone writes to, one lock, one leader. That work cannot be spread across servers, so it caps how much extra servers can help.

## How It Works

1. **Scale out**: put a load balancer in front of several identical, stateless servers (the golden rule from f01), so any of them can take any request.
2. **Speedup is limited by the serial fraction.** This is Amdahl's law: with a serial share `s` and `n` servers, the speedup is `1 / (s + (1 - s) / n)`, and it can never exceed `1 / s`:

```js
// sim.mjs
const speedup = (n, serial) => 1 / (serial + (1 - serial) / n);
```

3. **Capacity is one server's capacity times the speedup**, not times the server count.

At 2% serial work, 40 servers give a speedup of 22.5x, not 40x. Capacity is 11,236 requests a second, utilization falls from 1,600% to 71%, and each server is doing 56% of the work it could.

## When It Breaks

Buy ten times more servers (400) and the speedup only reaches 44.5x against a ceiling of 50x. Efficiency drops to 11%, and the bill goes from $4,000 to $40,000 a month for about twice the capacity.

The same law is harsher when more of the work is serial. At 5% serial the ceiling is 20x, and the speedup is 6.9x at 10 servers, 16.8x at 100 and only 19.6x at 1,000. The fix is not more app servers. It is to shrink the serial part: read replicas, caching and sharding the database, which later chapters cover.

## The Trade-off

Scaling up avoids all of that: one machine 8 times bigger has no load balancer and no serial penalty. In the sim it costs $1,200 a month against $4,000 for the fleet, but it has a hard ceiling (4,000 requests a second, 200% utilization here) and everything runs on one box. If it fails, 100% of traffic fails with it, where one of 40 servers takes out 2.5%.

Scale up first while it is cheap and simple. Scale out when you hit the ceiling or need to survive a failure.

## In The Wild

Every large system ends up scaling out the stateless tier and then fighting the shared state underneath it. That is why the database is usually the first thing to be sharded or replicated, and why the serial fraction, not the server count, is the number to watch.

## Try It

```sh
node course/1_fundamentals/f05_scalability/sim.mjs --serialPct=5 --servers=100
```

You should see four frames. The scale-out frame reports `speedup=16.8  efficiencyPct=16.8`, and the ten-times frame (1,000 servers) reports `speedup=19.6  efficiencyPct=2`, so a thousand servers barely beat a hundred. Try `--serialPct=0` to remove the ceiling.

## Say It In The Interview

1. Define both: scale up means a bigger machine, scale out means more machines. Say when you would use each.
2. State the golden rule: keep services stateless so they can scale out.
3. Cite Amdahl's law: the serial part sets a ceiling, so find the bottleneck before adding servers.
4. Note the risks: a single big box is a single point of failure, and scaling too early wastes money.

## Boundary

This chapter shows why scaling out has a limit. How a load balancer spreads traffic is b01, and how to shrink the shared bottleneck is b04 (caching), b02 (databases) and p03 (sharding).

## What's Next

If adding servers helps only up to a point, what do you add when reads dominate? That starts the evolution of a real web app in e01.

## Source notes

- [Scalability](../../../vault/system_design/01_fundamentals/scalability.md)
