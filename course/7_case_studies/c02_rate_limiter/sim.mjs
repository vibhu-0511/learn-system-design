// c02 sim: capacity and bottleneck run for a DISTRIBUTED rate limiter (Redis counters shared by
// many gateways). b09 covers the algorithms; this run sizes the shared store.
// Assumptions from the vault note: 1M active users, 100 requests a minute each, 3x peak, each
// check costs 2 Redis operations, one Redis instance serves about 100K ops/s, a check adds about
// 2 ms, the overhead target is under 5 ms, a Redis timeout of 10 ms then fail-open, 1,000
// concurrent requests per gateway plus 2 spare, and costs of $600 per Redis instance (a master
// with 2 replicas is 3 instances), $208 per gateway, $300 for the load balancer and $1,000 a
// month per million requests a second of data transfer. Assumed here and not in the vault:
// shards are sized to 70% load, latency rises as base / (1 - 0.7 x load), a client reaches at
// most 4 gateways, and the per-client limit is 100 requests a minute.
// Runs in Node (node sim.mjs --growth=5) and in the browser.

export const PARAMS = {
  usersM: { label: "Active users", unit: "M", min: 0.1, max: 10, step: 0.1, default: 1 },
  reqPerUserMin: { label: "Requests per user", unit: "per min", min: 10, max: 1000, step: 10, default: 100 },
  peakFactor: { label: "Peak over average", unit: "x", min: 1, max: 10, step: 1, default: 3 },
  growth: { label: "Traffic growth", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  syncBatch: { label: "Tokens taken from Redis at once", unit: "", min: 1, max: 50, step: 1, default: 5 },
};

const OPS_PER_CHECK = 2;
const REDIS_OPS_PER_INSTANCE = 100000;
const TARGET_LOAD = 0.7;
const BASE_MS = 2;
const TIMEOUT_MS = 10;
const GATEWAY_CONCURRENT = 1000;
const GATEWAY_SPARE = 2;
const INSTANCES_PER_SHARD = 3;
const REDIS_USD = 600;
const GATEWAY_USD = 208;
const LB_USD = 300;
const TRANSFER_USD_PER_MRPS = 1000;
const CLIENT_GATEWAYS = 4;
const LIMIT_PER_MIN = 100;
const round1 = (n) => Math.round(n * 10) / 10;
const fmt = (n) => n.toLocaleString("en-US");

function outcome({ reqRps, opsRps, shards, sync }) {
  const load = opsRps / (shards * REDIS_OPS_PER_INSTANCE);
  const overheadMs = load >= 1 ? TIMEOUT_MS : Math.min(TIMEOUT_MS, BASE_MS / (1 - 0.7 * load));
  const gateways = Math.ceil((reqRps * (overheadMs / 1000)) / GATEWAY_CONCURRENT) + GATEWAY_SPARE;
  const instances = shards === 1 ? 1 : shards * INSTANCES_PER_SHARD;
  return {
    peakReqRps: Math.round(reqRps),
    redisOpsRps: Math.round(opsRps),
    redisShards: shards,
    redisLoadPct: Math.round(load * 100),
    overheadMs: round1(overheadMs),
    uncheckedPct: load > 1 ? Math.round(100 * (1 - 1 / load)) : 0,
    overshootPct: Math.round((100 * CLIENT_GATEWAYS * (sync - 1)) / LIMIT_PER_MIN),
    monthlyCostUsd: Math.round(instances * REDIS_USD + gateways * GATEWAY_USD + LB_USD + (reqRps / 1e6) * TRANSFER_USD_PER_MRPS),
  };
}

const shardsFor = (opsRps) => Math.max(1, Math.ceil(opsRps / (REDIS_OPS_PER_INSTANCE * TARGET_LOAD)));

export function run({ usersM, reqPerUserMin, peakFactor, growth, syncBatch }) {
  const reqRps = ((usersM * 1e6 * reqPerUserMin) / 60) * peakFactor;
  const opsRps = reqRps * OPS_PER_CHECK;

  const single = outcome({ reqRps, opsRps, shards: 1, sync: 1 });
  const shards = shardsFor(opsRps);
  const sharded = outcome({ reqRps, opsRps, shards, sync: 1 });
  const grownReq = reqRps * growth;
  const grownOps = opsRps * growth;
  const grown = outcome({ reqRps: grownReq, opsRps: grownOps, shards, sync: 1 });
  const unbatchedShards = shardsFor(grownOps);
  const batchedShards = shardsFor(grownOps / syncBatch);
  const batched = outcome({ reqRps: grownReq, opsRps: grownOps / syncBatch, shards: batchedShards, sync: syncBatch });

  return {
    frames: [
      {
        beat: "constraints",
        title: `${usersM}M users at ${reqPerUserMin} requests a minute`,
        note: `Peak is ${fmt(single.peakReqRps)} requests/s and every check costs ${OPS_PER_CHECK} Redis operations, so ${fmt(single.redisOpsRps)} ops/s. One Redis instance serves about ${fmt(REDIS_OPS_PER_INSTANCE)} ops/s: this is ${single.redisLoadPct}% of it, so ${single.uncheckedPct}% of checks would time out.`,
        metrics: single,
      },
      {
        beat: "component",
        title: "v1: gateways check a sharded Redis cluster",
        note: `${shards} shards, each a master with 2 replicas, run at ${sharded.redisLoadPct}% load. Every check adds about ${sharded.overheadMs} ms and costs about $${fmt(sharded.monthlyCostUsd)} a month. All gateways see the same counter, so the limit holds across servers.`,
        metrics: sharded,
      },
      {
        beat: "failure",
        title: `Traffic grows ${growth}x on the same cluster`,
        note: `The same ${shards} shards now get ${fmt(grown.redisOpsRps)} ops/s: ${grown.redisLoadPct}% load. Checks time out after ${TIMEOUT_MS} ms and fail open, so ${grown.uncheckedPct}% of requests are never counted. The limiter that should shield the backend has stopped doing so.`,
        metrics: grown,
      },
      {
        beat: "tradeoff",
        title: `Take ${syncBatch} tokens per Redis call`,
        note: `Gateways draw ${syncBatch} tokens at a time and spend them locally, so Redis sees ${syncBatch}x fewer operations: ${batchedShards} shards instead of ${unbatchedShards}. The price is accuracy: a client that reaches ${CLIENT_GATEWAYS} gateways can slip about ${batched.overshootPct}% of its limit past the counter.`,
        metrics: batched,
      },
    ],
    summary: { redisShards: shards, unbatchedShards, batchedShards },
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
