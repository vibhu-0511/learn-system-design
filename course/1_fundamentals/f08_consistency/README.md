# f08: Consistency Models — Consistency is a dial, and quorums let you set it per operation

Fundamentals · f07 → **f08** → e01

> *"Overlap the write set and the read set"*
>
> **Concern**: consistency · latency · availability

## The Problem

Your shop shows "5 items in stock". Two customers buy the last item at the same moment. With eventual consistency both purchases succeed, and you have sold something you do not have. With strong consistency only one succeeds, but every request now waits for replicas to agree, and can fail if some are down.

You want to pick the level per operation, and you want to know what it costs.

## The Idea

You update your profile picture. With **strong consistency** everyone sees it immediately. With **eventual consistency** a friend on the other side of the world may see the old picture for a few seconds. In between sit weaker guarantees that are often all you need: **read-your-writes** (you always see your own update), **monotonic reads** (you never see time go backwards) and **causal consistency** (a reply never appears before the message it answers).

Replicated stores let you dial this with **quorums**. With `N` replicas, a write waits for `W` of them to acknowledge and a read asks `R` of them. If `W + R > N`, the read set and the write set must share at least one replica, so a read is guaranteed to touch a copy of the latest write.

## How It Works

1. **A write is acknowledged by W replicas.** The rest catch up in the background.
2. **A read asks R replicas** and takes the newest answer.
3. **The chance a read misses the latest write** is the chance all R replicas it picked are among the N-W that did not get it. It is zero whenever `W + R > N`:

```js
// sim.mjs
// Chance that R random replicas all missed a write that reached W of N.
const staleProbability = (n, w, r) => (w + r > n ? 0 : choose(n - w, r) / choose(n, r));
```

4. **Latency is the slowest replica you wait for.** Waiting for 3 of 5 replicas costs more than waiting for 1.

With 5 replicas, writing to 1 and reading from 1 is fast (5 ms), but a random read misses the latest write 80% of the time. Setting `W = R = 3` makes stale reads impossible (3 + 3 > 5) at 11 ms per operation.

## When It Breaks

A quorum needs enough live replicas. With `W = R = 3` on 5 replicas, two can be down and everything still works and stays consistent. Set the quorum to 4 and only 3 replicas are alive with 2 down, so reads and writes both fail.

Get it wrong the other way and `W + R <= N`: the sets can miss each other. With `W = R = 2` on 5 replicas, 30% of reads are stale. A weak quorum looks fine in testing and fails only under lag.

## The Trade-off

`W = N` and `R = 1` is also strongly consistent (`N + 1 > N`), and it makes reads cheap: 5 ms and never stale. But every write waits for the slowest replica (17 ms) and stops if any replica is down.

The common configurations from the vault note are:

| Setup | W | R | N | Behavior |
|---|---|---|---|---|
| Balanced | 2 | 2 | 3 | Strong, general purpose |
| Fast read | 3 | 1 | 3 | Strong, cheap reads, slow writes |
| Fast write | 1 | 3 | 3 | Strong, cheap writes, slow reads |
| Maximum performance | 1 | 1 | 3 | Eventual, for logs and analytics |

## In The Wild

Cassandra and DynamoDB expose this dial directly: you choose a consistency level per request, so the same table can serve a strict read for a balance and a cheap read for a feed.

## Try It

```sh
node course/1_fundamentals/f08_consistency/sim.mjs --replicas=7 --quorum=4 --down=3
```

You should see four frames. The first reports `stalePct=85.7` for a random read with one replica, and the quorum frame reports `stalePct=0  writeMs=14`. With 3 of 7 replicas down, 4 remain, exactly enough for a quorum of 4. Try `--quorum=2` to break the overlap.

## Say It In The Interview

1. Name the spectrum: linearizable, sequential, causal, read-your-writes, monotonic reads, eventual.
2. State the quorum rule: `W + R > N` guarantees the read sees the latest write.
3. Show the dial: fast reads (`W = N`, `R = 1`), fast writes (`W = 1`, `R = N`) or balanced.
4. Say it is per operation: strong for payments and inventory, eventual for feeds.

## Boundary

This chapter covers the consistency levels and quorum math. The trade-off during a partition is f06, and choosing consistency versus availability for a whole system is t01.

## What's Next

You now have the fundamentals. The next track watches one system grow through them, from a single server to millions of users: e01.

## Source notes

- [Consistency models](../../../vault/system_design/01_fundamentals/consistency_models.md)
