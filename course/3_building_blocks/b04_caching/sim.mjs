// b04 sim: a cache-aside cache in front of a database.
// Model: each cached key is read about keyRate times per second. A key misses only
// on the first read after it expires, so hit rate = r*T / (1 + r*T) for a TTL of T.
// Assumptions: reads only; the cache itself never becomes the bottleneck.
// Runs in Node (node sim.mjs --ttlSeconds=300) and in the browser.

export const PARAMS = {
  readRps: { label: "Read traffic", unit: "req/s", min: 2000, max: 50000, step: 1000, default: 20000 },
  dbCapacity: { label: "Database capacity", unit: "req/s", min: 1000, max: 20000, step: 500, default: 5000 },
  keyRate: { label: "Reads per key", unit: "per s", min: 0.01, max: 1, step: 0.01, default: 0.05 },
  ttlSeconds: { label: "Cache TTL", unit: "s", min: 5, max: 3600, step: 5, default: 120 },
};

const HIT_MS = 1; // a hit is served from memory
const DB_MS = 6; // an unloaded database read
const TIMEOUT_MS = 2000;
const round1 = (n) => Math.round(n * 10) / 10;

const hitRate = (keyRate, ttlSeconds) => (keyRate * ttlSeconds) / (1 + keyRate * ttlSeconds);

function measure(readRps, dbCapacity, hit, staleSeconds) {
  const dbRps = readRps * (1 - hit);
  const utilization = dbRps / dbCapacity;
  // A loaded database queues (see f04): read time grows as utilization nears 1.
  const dbMs = utilization >= 1 ? TIMEOUT_MS : Math.min(DB_MS / (1 - utilization), TIMEOUT_MS);
  return {
    hitRatePct: round1(hit * 100),
    dbLoadRps: Math.round(dbRps),
    dbUtilizationPct: round1(utilization * 100),
    avgLatencyMs: round1(hit * HIT_MS + (1 - hit) * dbMs),
    droppedRps: Math.round(Math.max(0, dbRps - dbCapacity)),
    maxStaleSec: staleSeconds,
  };
}

export function run({ readRps, dbCapacity, keyRate, ttlSeconds }) {
  const none = measure(readRps, dbCapacity, 0, 0);
  const warm = measure(readRps, dbCapacity, hitRate(keyRate, ttlSeconds), ttlSeconds);
  const longTtl = ttlSeconds * 5;
  const longer = measure(readRps, dbCapacity, hitRate(keyRate, longTtl), longTtl);

  return {
    frames: [
      {
        beat: "constraints",
        title: "No cache",
        note: `${readRps} reads/s hit a database that handles ${dbCapacity}/s. Every read goes to the database.`,
        metrics: none,
      },
      {
        beat: "component",
        title: `Cache-aside, ${ttlSeconds} s TTL`,
        note: `Reads check the cache first. A ${warm.hitRatePct}% hit rate leaves the database ${warm.dbLoadRps} reads/s.`,
        metrics: warm,
      },
      {
        beat: "failure",
        title: "Cache restarts empty",
        note: `A cold cache misses everything, so the database takes the full ${readRps} reads/s again until the cache refills.`,
        metrics: none,
      },
      {
        beat: "tradeoff",
        title: `Longer TTL, ${longTtl} s`,
        note: `Hit rate rises to ${longer.hitRatePct}% and the database load drops to ${longer.dbLoadRps}/s, but a cached value can now be ${longTtl} s out of date.`,
        metrics: longer,
      },
    ],
    summary: { hitRatePct: warm.hitRatePct, dbLoadRps: warm.dbLoadRps, coldDbRps: none.dbLoadRps },
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
