// b09 sim: a buggy client hammers /search and we decide which requests to let through.
// Assumptions: time runs in whole milliseconds; the client sends `batch` requests at the same
// instant, twice (no limit / boundary case at 0.9 s and 1.0 s, well-behaved case at 0.5 s and
// 1.5 s); the backend can serve `backendRps` requests a second; a "burst" is the most requests
// let through in any 100 ms; the token bucket starts full (capacity = limit) and refills
// `refillPerSec` tokens a second; the leaky bucket queue holds `limit` requests and drains at
// `refillPerSec`. Rejected requests get HTTP 429.
// Runs in Node (node sim.mjs --batch=100) and in the browser.

export const PARAMS = {
  limit: { label: "Limit", unit: "req/s", min: 1, max: 100, step: 1, default: 10 },
  batch: { label: "Requests per client burst", unit: "", min: 1, max: 1000, step: 1, default: 50 },
  refillPerSec: { label: "Bucket refill", unit: "per s", min: 1, max: 50, step: 1, default: 2 },
  backendRps: { label: "Backend capacity", unit: "req/s", min: 10, max: 1000, step: 10, default: 150 },
};

const WINDOW_MS = 100;
const round1 = (n) => Math.round(n * 10) / 10;

const burstAt = (times, batch) => times.flatMap((t) => Array(batch).fill(t));

const allowAll = () => () => true;

function fixedWindow(limit) {
  const counts = new Map();
  return (t) => {
    const w = Math.floor(t / 1000);
    const n = counts.get(w) ?? 0;
    counts.set(w, n + 1);
    return n < limit;
  };
}

function tokenBucket(capacity, refillPerSec) {
  let tokens = capacity;
  let last = 0;
  return (t) => {
    tokens = Math.min(capacity, tokens + ((t - last) / 1000) * refillPerSec);
    last = t;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
}

function outcome(times, allow, backendRps) {
  const passed = times.filter((t) => allow(t));
  let worst = 0;
  for (const t of passed) worst = Math.max(worst, passed.filter((u) => u >= t && u - t <= WINDOW_MS).length);
  return {
    allowed: passed.length,
    rejected: times.length - passed.length,
    worstBurst: worst,
    backendLoadPct: Math.round(((worst * 1000) / WINDOW_MS / backendRps) * 100),
  };
}

export function run({ limit, batch, refillPerSec, backendRps }) {
  const edge = burstAt([900, 1000], batch);
  const calm = burstAt([500, 1500], batch);

  const none = outcome(edge, allowAll(), backendRps);
  const calmFixed = outcome(calm, fixedWindow(limit), backendRps);
  const edgeFixed = outcome(edge, fixedWindow(limit), backendRps);
  const bucket = outcome(edge, tokenBucket(limit, refillPerSec), backendRps);

  const leakySeconds = round1(Math.min(limit, batch) / refillPerSec);

  return {
    frames: [
      {
        beat: "constraints",
        title: "No limit: two client bursts",
        note: `A buggy client sends ${batch} requests at 0.9 s and ${batch} more at 1.0 s. All ${none.allowed} get through, up to ${none.worstBurst} inside 100 ms, which loads the backend to ${none.backendLoadPct}% of its ${backendRps} requests a second.`,
        metrics: none,
      },
      {
        beat: "component",
        title: `Fixed window: ${limit} a second`,
        note: `A counter per second lets ${calmFixed.allowed} through and answers 429 to ${calmFixed.rejected} when the bursts land in separate windows (0.5 s and 1.5 s). The worst burst is ${calmFixed.worstBurst}, and the state is one number.`,
        metrics: calmFixed,
      },
      {
        beat: "failure",
        title: "The window boundary burst",
        note: `The bursts at 0.9 s and 1.0 s fall in different windows, and each window admits ${limit}. So ${edgeFixed.worstBurst} pass in 100 ms, up to twice the limit, and the backend runs at ${edgeFixed.backendLoadPct}% of capacity.`,
        metrics: edgeFixed,
      },
      {
        beat: "tradeoff",
        title: `Token bucket: ${limit} tokens, ${refillPerSec} a second`,
        note: `The bucket allows a burst of up to ${limit}, then holds the average rate, so the boundary trick lets only ${bucket.allowed} through (${bucket.backendLoadPct}% load). A leaky bucket would smooth output to ${refillPerSec} a second but make the last queued request wait ${leakySeconds} s.`,
        metrics: bucket,
      },
    ],
    summary: { edgeFixedBurst: edgeFixed.worstBurst, bucketBurst: bucket.worstBurst },
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
