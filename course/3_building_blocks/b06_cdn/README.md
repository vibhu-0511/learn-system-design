# b06: CDN — Serve content from near the user, and decide how long a copy may be wrong

Building blocks · b05 → **b06** → b07

> *"Move the copy to the user instead of the user to the copy"*
>
> **Concern**: latency · cost

## The Problem

Your app server is in US-East. A user in Tokyo requests your homepage: HTML, CSS, JavaScript and images, about 2 MB. With a 200 ms round trip and seven of them to set up and fetch, the page takes 1.8 seconds even on a fast connection, and the note's slower example takes 4. Sixty percent of your users are in Asia.

Your origin also takes every one of a million requests a day, which is $3,000 a month in the sim.

## The Idea

Instead of shipping every Amazon order from one warehouse in Seattle, Amazon builds warehouses near every major city. A **CDN** (content delivery network) does the same for web content: it copies your files to servers around the world so users get them from a nearby **edge** instead of your **origin**.

The edge answers from its cache when it can (a **hit**) and fetches from the origin when it cannot (a **miss**). Copies expire after a **TTL**, and you can also **purge** them early.

```mermaid
flowchart LR
  U[User in Tokyo] --> E[Edge, 20 ms away]
  E -- hit --> U
  E -. miss .-> O[Origin, 200 ms away]
  O -.-> E
```

## How It Works

1. **The user's request goes to the nearest edge**, chosen by DNS or anycast routing.
2. **A hit is answered immediately** from the edge's cache. A miss adds one trip to the origin.
3. **How often it hits depends on repetition and TTL.** With an object requested every 2 seconds and a 60-second TTL, the hit rate is 96.8%. This is the same model as b04:

```js
// sim.mjs
const roundTrips = SETUP_RTTS + Math.ceil(RESOURCES / PARALLEL);
const hitRate = (rate, ttl) => (rate * ttl) / (1 + rate * ttl);
```

4. **The page load falls from 1,800 ms to 546 ms**, and origin requests from 1,000,000 a day to 32,258, at $697 a month against $3,000. The vault note's own example shows the same shape: a 95% hit ratio cuts origin load, bandwidth and origin cost by 95%, for a cheap CDN bill.

The remaining time is mostly transfer, not distance. A CDN removes round trips, not bandwidth.

## When It Breaks

A CDN is only as good as its hit rate. After a full purge, a deploy that changes every URL, or a TTL that is too short, the cache runs cold. With a 5-second TTL the hit rate falls to 71.4% and 285,714 requests a day reach the origin, 8.9 times more. A cold cache can send the origin a wave it was never sized for, the same stampede as in b04.

The CDN is also a single point of failure. In the 2021 Fastly outage a customer's valid configuration triggered a latent bug in the edge software and most locations returned errors, taking major sites offline while their own servers were healthy.

## The Trade-off

A long TTL wins on hit rate and cost: a 60-minute TTL reaches a 99.9% hit rate and $602 a month, close to the CDN's own fee. The price is staleness. A file you changed can be served an hour old unless you **purge** it or, better, **version the URL** (`app.4f3a9c.js`), so a new deploy is a new URL and the old cached copy never matters.

The vault note also covers push CDNs (you upload content to the edge) versus pull CDNs (the edge fetches on first request). Pull is simpler and the usual default.

## In The Wild

CloudFront and Cloudflare are the common choices, and the vault note has annotated configuration for both. Static assets (images, scripts, video segments) are the obvious fit. Dynamic, personalized responses can be cached too, with care about what varies per user.

## Try It

```sh
node course/3_building_blocks/b06_cdn/sim.mjs --ttlSeconds=300
```

You should see four frames. With a 5-minute TTL the CDN frame reports `hitRatePct=99.3  originRequestsPerDay=6623  monthlyCostUsd=620`. Try `--edgeRttMs=50` to see a farther edge lose some of its advantage.

## Say It In The Interview

1. Define the CDN, the edge and the origin, and hit versus miss.
2. Give the win: lower latency and less origin load, with the hit-ratio math.
3. Explain invalidation: TTL, purge and versioned URLs.
4. Name the risks: staleness, a cold cache stampeding the origin, and the CDN as a dependency.

## Boundary

This chapter covers caching at the edge. Caching in front of a database is b04, and the transport-level speedups (HTTP/2 and HTTP/3) are f02.

## What's Next

A CDN caches files, but where do the files live? For user uploads, that is b07, blob storage.

## Source notes

- [CDN](../../../vault/system_design/02_building_blocks/cdn.md)
