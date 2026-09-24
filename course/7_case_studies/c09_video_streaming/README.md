# c09: Video Streaming — Cut it into chunks, cache the chunks, and protect the origin

Case studies · c08 → **c09** → c10

> *"Nobody streams from your servers; they stream from the nearest copy"*
>
> **Concern**: scalability · latency · cost

## The Problem

A startup lets users upload videos to its web servers, and the same servers stream them back. The vault note lists how the first weeks go. A 2 GB upload floods a server's memory. Viewers in Europe wait more than 10 seconds for videos stored in the US. One viral 500 MB video sent to 100,000 viewers is 50 TB of transfer. Phones on 3G cannot play 1080p over a 2 Mbit/s link, and storing every raw upload forever makes the bill explode.

Requirements from the note: upload, stream with adaptive quality, start playing in under about 200 ms, deliver globally, handle multi-gigabyte files and many device speeds. Search, recommendations and comments are also listed, and this chapter leaves them out.

## The Idea

Treat a video as a pile of small static files, and treat streaming as file download from the nearest cache. Four parts do the work:

```mermaid
flowchart LR
  U[Uploader] -- "multipart upload" --> S[(Object storage: raw)]
  S --> T[Transcoder]
  T -- "3 qualities, 2-10 s chunks + manifest" --> O[(Object storage: chunks)]
  O --> SH[Shield tier]
  SH --> E[CDN edge]
  E -- "next chunk at the quality the network allows" --> P[Player]
```

The **transcoder** turns one raw file into several qualities, each cut into 2-10 second chunks, with a manifest listing them (HLS or DASH). The **player** measures its bandwidth and picks the quality of each next chunk, so a slow phone drops to 360p instead of stalling. That is **adaptive bitrate** (ABR). The **CDN** (b06) caches popular chunks near viewers, and **object storage** (b07) holds everything else.

## How It Works

Start with the constraints, using the note's numbers: 200M daily users, 5 views each, 500K uploads a day of 500 MB, and 3 stored formats. The sim adds a few assumptions: peak traffic is 2x the daily average and a view lasts 10 minutes.

```js
// sim.mjs
  const concurrentM = (viewsRps * watchMin * 60) / 1e6;
  const egressTbps = concurrentM * bitrate;
  const miss = cdn ? 1 - hitPct / 100 : 1;
  const originTbps = egressTbps * miss * (shield ? 1 - shieldPct / 100 : 1);
```

1. **Traffic.** 1 billion views a day is 11,574 a second on average and 23,148 at peak. At 10 minutes each, 13.9 million streams play at once.
2. **The naive design** sends every stream from your own servers at 1080p (5 Mbit/s). That is 69.4 Tbit/s of egress. The sim's origin serves 5 Tbit/s, so it runs at 1389% and startup is 500 ms.
3. **The v1 design** transcodes and chunks each upload, stores every quality, and puts a CDN in front. ABR averages about 2.5 Mbit/s (the note's 720p), so egress is 34.7 Tbit/s. With a 90% hit rate only 3.5 Tbit/s reaches the origin (69%), and startup is 60 ms.
4. **Storage** grows in exchange. 500K uploads of 500 MB is 250 TB a day. Keeping 3 formats makes it 750 TB a day, matching the note. That is the price of ABR: every quality is stored, on the assumption that storage is cheaper than a stalled player.

## When It Breaks

The v1 design works until the traffic multiplies. At 10x, 231,481 views a second means 138.9 million concurrent streams and 347.2 Tbit/s at the edge. The hit rate has not changed, but 10% of ten times as much traffic is still ten times as much: the origin is asked for 34.7 Tbit/s, or 694% of what it can serve.

A hit rate is a percentage, and the origin lives on absolute numbers. A CDN that protects you at 90% needs to keep protecting you when the audience grows, and the misses cluster on new and long-tail videos, which are exactly the ones nobody has cached yet.

## The Trade-off

The fix used by real CDNs is a **shield tier**: edges that miss ask one regional cache before they ask the origin, and that cache collapses many edges' misses into one. If it absorbs 90% of them, the origin sees 3.5 Tbit/s (69%) again, the same as before the 10x. The sim shows startup at 57 ms, a little better than 60, because a shield hit is nearer than the origin.

What you pay is a second tier: more caches to run and size, a second place where stale chunks can live, and one more hop for every request that misses both. Turn `--shieldPct` down and the origin load rises in step, with no other dial doing the same job.

*Note: the vault note does not give an origin capacity, a peak factor, a watch time, a CDN hit rate for video, or hop latencies. The sim assumes 5 Tbit/s, 2x, 10 minutes, 90%, and 50/100/150 ms. The note's own ingest figure (~2.9 TB/hr) is the per-second rate; 250 TB a day is about 10.4 TB an hour.*

## In The Wild

The vault note cites Netflix: over 260M subscribers, about 15% of global internet bandwidth at peak, more than a billion hours a week and over 100 PB stored. It works because titles are transcoded once, cut into chunks and pushed toward viewers ahead of demand, not streamed on request from a central place. YouTube follows the same pattern of chunks, ABR and a CDN.

## Try It

```sh
node course/7_case_studies/c09_video_streaming/sim.mjs --cdnHitPct=99
```

You should see four frames. The second reports `originTbps=0.3  originUtilPct=7  startupMs=51` at a 99% hit rate. The failure frame at 10x then shows `originTbps=3.5  originUtilPct=69`: a higher hit rate buys the headroom that a shield tier gives at 90%. At the default 90%, the failure frame reads `originUtilPct=694`, and the trade-off frame reads `originUtilPct=69  cacheTiers=2  startupMs=57`. Try `--spikeMultiplier=20`.

## Say It In The Interview

1. Put requirements and numbers first: 1B views a day, 500K uploads of 500 MB.
2. Never stream from app servers: upload to object storage, transcode into qualities, cut into chunks.
3. Explain ABR: the player picks the quality of each chunk from its measured bandwidth.
4. Serve chunks from a CDN, and say what happens on a miss storm: a shield tier.
5. Name the price: storage times the number of qualities, and one more cache tier to run.

## Boundary

This chapter covers uploading and playing back video. Search and recommendations are separate systems. Only the object-store and CDN basics are repeated here: see b07 and b06. Live streaming, which cannot pre-warm caches, is not covered.

## What's Next

A video is a file that many people read. A ride is the opposite: millions of moving dots writing their position every few seconds. How do you find the nearest driver? Next: c10.

## Source notes

- [Design video streaming](../../../vault/system_design/05_case_studies/design_video_streaming.md)
