# f04: Latency & Throughput — Latency is what one request feels; throughput is what the system sustains

Fundamentals · f03 → **f04** → f05

> *"Waiting time explodes long before capacity runs out"*
>
> **Concern**: latency · scalability

> Placeholder chapter. P2 replaces this text and the sim with the full lesson.

## The Problem

Your API serves 80 requests a second and every request takes 50 ms. Traffic grows 25% and pages start timing out. The server never crashed. It just ran out of spare capacity.

## The Idea

Latency is how long one request takes. Throughput is how many requests finish per second. They are linked by a queue: the closer a server runs to its limit, the longer each request waits behind the others.

## How It Works

Average time in the system for a steady queue is one over the spare capacity, so it grows without bound as spare capacity shrinks:

```js
// sim.mjs
function latencyMs(arrival, service) {
  const spare = service - arrival;
  return spare > 0 ? Math.min(1000 / spare, TIMEOUT_MS) : TIMEOUT_MS;
}
```

## When It Breaks

At 80% utilization latency is 50 ms. At 95% it is 200 ms. At 100% the queue never drains and clients time out.

## The Trade-off

Batching requests raises capacity, but every request now waits for its batch. You buy throughput with latency.

## In The Wild

Most services page on latency percentiles, not averages, because the slowest requests are the ones stuck deep in a queue.

## Try It

```sh
node course/1_fundamentals/f04_latency_throughput/sim.mjs --arrivalRate=95
```

You should see four frames. The first reports `utilizationPct=95  latencyMs=200  throughput=95`, and the failure frame hits `latencyMs=10000`.

## Say It In The Interview

1. Latency and throughput are different: name which one the requirement is about.
2. Utilization near 100% means unbounded waiting, so plan headroom.
3. Quote percentiles (p95, p99), not averages.

## Boundary

This chapter defines and measures. Choosing between the two as a design decision belongs to t02.

## What's Next

If waiting time depends on spare capacity, how do you add capacity without redesigning everything? That is f05 Scalability.

## Source notes

- [Latency and throughput](../../../vault/system_design/01_fundamentals/latency_and_throughput.md)
