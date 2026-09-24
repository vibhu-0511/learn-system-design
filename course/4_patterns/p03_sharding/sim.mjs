// p03 sim: splitting one hot table across shards, by hash or by key range.
// Assumptions: 1,000 keys ranked by popularity; the traffic to key i is proportional to
// 1 / i^skew (skew 0 is uniform, 1 is a typical Zipf-shaped skew where a few keys are hot);
// key ranks follow key order, so the popular keys sit together (like newest ids or the same
// prefix); hash sharding uses a fixed integer hash (no randomness); range sharding gives each
// shard an equal block of consecutive keys; a range scan of 100 consecutive keys is the query.
// Runs in Node (node sim.mjs --skew=1.5) and in the browser.

export const PARAMS = {
  totalRps: { label: "Total traffic", unit: "req/s", min: 1000, max: 200000, step: 1000, default: 40000 },
  shardCapacityRps: { label: "One shard's capacity", unit: "req/s", min: 1000, max: 50000, step: 1000, default: 12000 },
  shards: { label: "Shards", unit: "", min: 1, max: 16, step: 1, default: 4 },
  skew: { label: "Key skew", unit: "", min: 0, max: 2, step: 0.1, default: 1 },
};

const KEYS = 1000;
const SCAN_KEYS = 100;

const hashShard = (key, shards) => {
  let h = Math.imul(key ^ (key >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return (h >>> 8) % shards;
};
const rangeShard = (key, shards) => Math.min(shards - 1, Math.floor(((key - 1) * shards) / KEYS));

function shardShares(place, shards, skew) {
  const weights = Array.from({ length: KEYS }, (_, i) => 1 / (i + 1) ** skew);
  const total = weights.reduce((a, b) => a + b, 0);
  const shares = Array(shards).fill(0);
  weights.forEach((w, i) => (shares[place(i + 1, shards)] += w / total));
  return shares;
}

function scanShards(place, shards) {
  return new Set(Array.from({ length: SCAN_KEYS }, (_, i) => place(400 + i, shards))).size;
}

function outcome(shares, place, { totalRps, shardCapacityRps, shards }) {
  const hottest = Math.max(...shares);
  return {
    hottestShardLoadPct: Math.round(((hottest * totalRps) / shardCapacityRps) * 100),
    averageShardLoadPct: Math.round((totalRps / shards / shardCapacityRps) * 100),
    hottestShareOfTrafficPct: Math.round(hottest * 100),
    rangeQueryShards: scanShards(place, shards),
  };
}

// Per-shard load (% of one shard's capacity) for a frame's beat, for the custom hero.
export function shardLoads(beat, { totalRps, shardCapacityRps, shards, skew }) {
  const n = beat === "constraints" ? 1 : shards;
  const place = beat === "constraints" ? () => 0 : beat === "tradeoff" ? rangeShard : hashShard;
  return shardShares(place, n, beat === "component" ? 0 : skew).map((s) => Math.round(((s * totalRps) / shardCapacityRps) * 100));
}

export function run({ totalRps, shardCapacityRps, shards, skew }) {
  const cfg = { totalRps, shardCapacityRps, shards };
  const one = outcome([1], () => 0, { ...cfg, shards: 1 });
  const uniform = outcome(shardShares(hashShard, shards, 0), hashShard, cfg);
  const skewedHash = outcome(shardShares(hashShard, shards, skew), hashShard, cfg);
  const skewedRange = outcome(shardShares(rangeShard, shards, skew), rangeShard, cfg);

  return {
    frames: [
      {
        beat: "constraints",
        title: "One database takes all the traffic",
        note: `${totalRps.toLocaleString("en-US")} requests a second against a machine that handles ${shardCapacityRps.toLocaleString("en-US")}: it runs at ${one.hottestShardLoadPct}% of capacity, and no bigger machine fixes it for long.`,
        metrics: one,
      },
      {
        beat: "component",
        title: `Hash sharding over ${shards} shards`,
        note: `A hash of the key picks the shard, so when keys are equally popular the traffic spreads evenly: the busiest shard is at ${uniform.hottestShardLoadPct}% against an average of ${uniform.averageShardLoadPct}%. A range scan of ${SCAN_KEYS} keys now touches ${uniform.rangeQueryShards} shard${uniform.rangeQueryShards > 1 ? "s" : ""}.`,
        metrics: uniform,
      },
      {
        beat: "failure",
        title: `Skewed keys (skew ${skew}) make a hot shard`,
        note: `A few keys draw most of the traffic, and hashing cannot split one key: the busiest shard takes ${skewedHash.hottestShareOfTrafficPct}% of all traffic and runs at ${skewedHash.hottestShardLoadPct}% while the average is ${skewedHash.averageShardLoadPct}%.`,
        metrics: skewedHash,
      },
      {
        beat: "tradeoff",
        title: "Range sharding: cheap scans, worse hot spots",
        note: `Consecutive keys stay together, so a ${SCAN_KEYS}-key scan touches ${skewedRange.rangeQueryShards} shard instead of ${skewedHash.rangeQueryShards}. But the popular keys share a shard: it runs at ${skewedRange.hottestShardLoadPct}% against ${skewedHash.hottestShardLoadPct}% with hashing.`,
        metrics: skewedRange,
      },
    ],
    summary: { hashHottestPct: skewedHash.hottestShardLoadPct, rangeHottestPct: skewedRange.hottestShardLoadPct },
  };
}

// CLI: only when this file is the entry point, and safe where `process` does not exist.
const entry = typeof process !== "undefined" ? process.argv?.[1] : undefined;
if (entry && decodeURIComponent(import.meta.url).endsWith(entry.replace(/\\/g, "/"))) {
  const params = Object.fromEntries(Object.entries(PARAMS).map(([k, p]) => [k, p.default]));
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, "").split("=");
    if (key in params) params[key] = Number(value);
  }
  console.log("params:", JSON.stringify(params));
  for (const [i, f] of run(params).frames.entries()) {
    console.log(`\n${i + 1}. [${f.beat}] ${f.title}\n   ${f.note}`);
    console.log("   " + Object.entries(f.metrics).map(([k, v]) => `${k}=${v}`).join("  "));
  }
}
