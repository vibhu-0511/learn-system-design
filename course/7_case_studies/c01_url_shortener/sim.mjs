// c01 sim: capacity and bottleneck run for a URL shortener.
// Assumptions: the requirement set is the vault note's (100M new URLs a month, 10:1 reads to
// writes, 3x peak over average, 5-year retention, 700 bytes per URL, 200 bytes per logged click,
// half of clicks logged, 50% storage buffer, 2 ms cache read, 30 ms database read, 80% cache
// hit rate, $100 per app server, $50 for the cache, $50 per database node). Assumed here and not
// in the vault: one database node serves about 1,000 reads/s, one app server holds 100
// concurrent requests, replicas are sized to run at 70% load, and a viral spike multiplies
// reads only, not writes.
// Runs in Node (node sim.mjs --spike=20) and in the browser.

export const PARAMS = {
  newUrlsM: { label: "New URLs per month", unit: "M", min: 10, max: 1000, step: 10, default: 100 },
  readWriteRatio: { label: "Reads per write", unit: "x", min: 1, max: 100, step: 1, default: 10 },
  peakFactor: { label: "Peak over average", unit: "x", min: 1, max: 10, step: 1, default: 3 },
  cacheHitPct: { label: "Cache hit rate", unit: "%", min: 0, max: 99, step: 1, default: 80 },
  spike: { label: "Viral spike on reads", unit: "x", min: 1, max: 20, step: 1, default: 10 },
};

const SECONDS_PER_MONTH = 30 * 86400;
const BYTES_PER_URL = 700;
const BYTES_PER_CLICK = 200;
const LOGGED_CLICK_SHARE = 0.5;
const STORAGE_BUFFER = 1.5;
const RETENTION_YEARS = 5;
const CACHE_MS = 2;
const DB_MS = 30;
const DB_NODE_RPS = 1000;
const SERVER_CONCURRENT = 100;
const TARGET_DB_LOAD = 0.7;
const SERVER_USD = 100;
const CACHE_USD = 50;
const DB_NODE_USD = 50;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ writeRps, readRps, hitPct, cached, dbNodes, storageTb }) {
  const dbReadRps = readRps * (1 - hitPct / 100);
  const avgLatencyMs = (hitPct / 100) * CACHE_MS + (1 - hitPct / 100) * DB_MS;
  const concurrent = readRps * (avgLatencyMs / 1000);
  const appServers = Math.max(3, Math.ceil(concurrent / SERVER_CONCURRENT));
  return {
    writeRps: round1(writeRps),
    peakReadRps: Math.round(readRps),
    dbReadRps: Math.round(dbReadRps),
    dbLoadPct: Math.round((dbReadRps / (dbNodes * DB_NODE_RPS)) * 100),
    avgLatencyMs: round1(avgLatencyMs),
    appServers,
    dbNodes,
    storageTb: round1(storageTb),
    monthlyCostUsd: appServers * SERVER_USD + (cached ? CACHE_USD : 0) + dbNodes * DB_NODE_USD,
  };
}

export function run({ newUrlsM, readWriteRatio, peakFactor, cacheHitPct, spike }) {
  const writeRps = (newUrlsM * 1e6) / SECONDS_PER_MONTH;
  const peakReads = writeRps * readWriteRatio * peakFactor;
  const urlTb = (newUrlsM * 1e6 * BYTES_PER_URL * 12 * RETENTION_YEARS * STORAGE_BUFFER) / 1e12;
  const clickTb = (writeRps * readWriteRatio * LOGGED_CLICK_SHARE * BYTES_PER_CLICK * SECONDS_PER_MONTH * 12 * RETENTION_YEARS) / 1e12;
  const storageTb = urlTb + clickTb;

  const bare = outcome({ writeRps, readRps: peakReads, hitPct: 0, cached: false, dbNodes: 1, storageTb });
  const cached = outcome({ writeRps, readRps: peakReads, hitPct: cacheHitPct, cached: true, dbNodes: 1, storageTb });
  const viral = outcome({ writeRps, readRps: peakReads * spike, hitPct: cacheHitPct, cached: true, dbNodes: 1, storageTb });
  const viralDbRps = peakReads * spike * (1 - cacheHitPct / 100);
  const dbNodes = Math.max(1, Math.ceil(viralDbRps / (DB_NODE_RPS * TARGET_DB_LOAD)));
  const scaled = outcome({ writeRps, readRps: peakReads * spike, hitPct: cacheHitPct, cached: true, dbNodes, storageTb });

  return {
    frames: [
      {
        beat: "constraints",
        title: `${newUrlsM}M new URLs a month, ${readWriteRatio}:1 reads`,
        note: `That is ${bare.writeRps} writes/s and ${bare.peakReadRps} reads/s at ${peakFactor}x peak, and about ${bare.storageTb} TB over ${RETENTION_YEARS} years. With no cache every read hits one database node, which is ${bare.dbLoadPct}% of what it can serve.`,
        metrics: bare,
      },
      {
        beat: "component",
        title: "v1: app servers, a cache in front, one database",
        note: `With ${cacheHitPct}% of reads answered from the cache, that leaves ${cached.dbReadRps} reads/s for the database (${cached.dbLoadPct}% load) and drops average latency to ${cached.avgLatencyMs} ms. It costs about $${cached.monthlyCostUsd} a month.`,
        metrics: cached,
      },
      {
        beat: "failure",
        title: `One link goes viral: reads x${spike}`,
        note: `Reads reach ${viral.peakReadRps}/s. The ${100 - cacheHitPct}% that miss the cache push the single database node to ${viral.dbReadRps} reads/s, ${viral.dbLoadPct}% of its capacity. Past 100% requests queue and time out.`,
        metrics: viral,
      },
      {
        beat: "tradeoff",
        title: "Read replicas, and every click still hits the server",
        note: `Adding replicas (${scaled.dbNodes} database nodes in all) brings the load to ${scaled.dbLoadPct}% and costs $${scaled.monthlyCostUsd} a month. Serving 302 redirects keeps every click visible for analytics; a 301 would let browsers cache the redirect and cut this traffic, but analytics would lose those clicks.`,
        metrics: scaled,
      },
    ],
    summary: { peakReadRps: bare.peakReadRps, viralDbLoadPct: viral.dbLoadPct, scaledCostUsd: scaled.monthlyCostUsd },
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
