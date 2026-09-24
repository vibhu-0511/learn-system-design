# f03: API Design — An API is a contract, and its shape sets the cost of every screen

Fundamentals · f02 → **f03** → f04

> *"Shape the API for the caller"*
>
> **Concern**: latency · scalability

## The Problem

A mobile screen shows a user, their 10 latest posts and each post's comments. With one endpoint per resource, the app makes 12 requests in three waves and downloads 48 KB, of which the screen uses a quarter. On a good connection that takes 188 ms. On a slow mobile network, where a round trip costs 300 ms, the same screen takes 938 ms.

Nothing is broken. The API is a faithful map of the database, and it does not match what the caller needs.

## The Idea

An API is a restaurant menu. It lists what you can order (endpoints), how to order (methods) and what comes back (responses), and it hides how the kitchen works. It is a contract between two teams, and a contract that is vague or awkward costs everyone who signs it.

Different callers want different shapes, so there is no single best style:

- **REST**: resources with URLs and HTTP verbs. Simple, cacheable and universal.
- **GraphQL**: the client asks for exactly the fields it needs in one query.
- **gRPC**: typed binary messages over HTTP/2. Compact and fast between services.
- **WebSocket**: a persistent two-way connection for chat and live updates.

## How It Works

1. **REST exposes one resource per URL.** `GET /users/1`, `GET /users/1/posts`, `GET /posts/7/comments`. Verbs say what to do and status codes say what happened.
2. **A screen that needs several resources makes several requests**, and dependent ones wait for the previous wave. A browser runs six at a time over HTTP/1.1.
3. **Each object comes back whole**, so the screen downloads fields it never shows.

```js
// sim.mjs
  const objects = posts + 2; // the user, the post list, and one comment list per post
  const restWaves = 1 + Math.ceil(posts / PARALLEL); // user and posts first, then the comments
```

4. **Shape the call for the screen.** A GraphQL query, or a purpose-built endpoint behind the app (a backend for frontend), returns only what the screen uses in one round trip: 12 KB in 59.6 ms.

## When It Breaks

Chatty APIs pay for every round trip, and the tax grows with the network's delay and the size of the list. The classic form is the N+1 problem: one request for a list, then one more for each item. Double the posts and you double the requests. Over-fetching adds a second cost: 75% of the bytes are thrown away.

Contracts also break when they change. Removing or renaming a field breaks every client that relied on it, which is why public APIs are versioned and additive.

## The Trade-off

Each fix moves the cost somewhere else:

- **GraphQL and shaped endpoints** save the client round trips but move complexity to the server. Caching is harder because one URL no longer means one cacheable thing, and expensive queries need limits.
- **gRPC** is compact (19.2 KB here, 115 ms) and typed, but browsers cannot call it directly, so web clients need a translating proxy.
- **REST** stays the simplest and most cacheable, and it works everywhere, so it is usually the right default for public APIs.

## In The Wild

Payment APIs such as Stripe accept an `Idempotency-Key` header on requests that change data, so a client can retry a timed-out call without charging twice. Making retries safe is part of the API contract, not an afterthought.

## Try It

```sh
node course/1_fundamentals/f03_api_design/sim.mjs --posts=25
```

You should see four frames. The first reports `requests=27` and the shaped call `requests=1`. Try `--neededPct=100` to see that the saving disappears when the screen needs every field, and `--rttMs=300` to see chatty APIs suffer.

## Say It In The Interview

1. Define an API as a contract and name the styles: REST, GraphQL, gRPC and WebSocket.
2. Say which you would choose for which caller: REST for public and cacheable, gRPC between services, WebSocket for real time.
3. Name the N+1 problem and over-fetching, and the fixes.
4. Mention that idempotent methods (GET, PUT, DELETE) are safe to retry and POST is not without an idempotency key.

## Boundary

This chapter compares API shapes by what a screen costs. Pagination, authentication and versioning are covered in the vault note, and making retries safe is p11.

## What's Next

We keep saying "fast" and "slow" without measuring. What exactly are latency and throughput? That is f04.

## Source notes

- [API design](../../../vault/system_design/01_fundamentals/api_design.md)
