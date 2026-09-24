// c04 sim: capacity and bottleneck run for search autocomplete (client debounce -> cache ->
// trie servers, with a batch pipeline that refreshes the trie).
// Assumptions from the vault notes: 5 billion searches a day, about 5 keystrokes each, so about
// 290K autocomplete requests a second; under 100 ms; suggestions pre-computed per prefix; a cache
// answering 80% or more of requests; the trie refreshed by a batch job every 15 minutes, with a
// faster pipeline for trending queries; a trie lookup under 10 ms. Assumed here and not in the
// vault: debounce and a minimum length remove 50% of keystroke requests, a Redis read takes 2 ms,
// one trie server answers 20,000 lookups a second and runs at 70% load, a trie server costs $200
// a month, the cache $500, the trending pipeline $3,000, it makes trending queries visible after
// 2 minutes, and during a trending spike the cache hit rate halves because the queries are new.
// Runs in Node (node sim.mjs --spike=20) and in the browser.

export const PARAMS = {
  queriesB: { label: "Searches per day", unit: "B", min: 1, max: 20, step: 1, default: 5 },
  keystrokes: { label: "Keystrokes per search", unit: "", min: 1, max: 10, step: 1, default: 5 },
  debouncePct: { label: "Requests removed by debounce", unit: "%", min: 0, max: 90, step: 5, default: 50 },
  cacheHitPct: { label: "Cache hit rate", unit: "%", min: 0, max: 99, step: 1, default: 80 },
  spike: { label: "Trending spike on requests", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  batchMin: { label: "Trie refresh interval", unit: "min", min: 1, max: 60, step: 1, default: 15 },
};

const CACHE_MS = 2;
const TRIE_MS = 10;
const TRIE_SERVER_RPS = 20000;
const TARGET_LOAD = 0.7;
const SERVER_USD = 200;
const CACHE_USD = 500;
const TRENDING_USD = 3000;
const TRENDING_STALE_MIN = 2;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ clientRps, hitPct, servers, staleMin, cached, trending }) {
  const trieRps = clientRps * (1 - hitPct / 100);
  return {
    clientRps: Math.round(clientRps),
    trieRps: Math.round(trieRps),
    trieServers: servers,
    trieLoadPct: Math.round((trieRps / (servers * TRIE_SERVER_RPS)) * 100),
    cacheHitPct: Math.round(hitPct),
    latencyMs: round1((hitPct / 100) * CACHE_MS + (1 - hitPct / 100) * TRIE_MS),
    staleMin,
    monthlyCostUsd: servers * SERVER_USD + (cached ? CACHE_USD : 0) + (trending ? TRENDING_USD : 0),
  };
}

const serversFor = (rps) => Math.max(1, Math.ceil(rps / (TRIE_SERVER_RPS * TARGET_LOAD)));

export function run({ queriesB, keystrokes, debouncePct, cacheHitPct, spike, batchMin }) {
  const keystrokeRps = (queriesB * 1e9 * keystrokes) / 86400;
  const debouncedRps = keystrokeRps * (1 - debouncePct / 100);

  const raw = outcome({ clientRps: keystrokeRps, hitPct: 0, servers: serversFor(keystrokeRps), staleMin: batchMin });
  const v1Servers = serversFor(debouncedRps * (1 - cacheHitPct / 100));
  const v1 = outcome({ clientRps: debouncedRps, hitPct: cacheHitPct, servers: v1Servers, staleMin: batchMin, cached: true });

  const trendHitPct = cacheHitPct / 2;
  const trendRps = debouncedRps * spike;
  const trending = outcome({ clientRps: trendRps, hitPct: trendHitPct, servers: v1Servers, staleMin: batchMin, cached: true });

  const scaledServers = serversFor(trendRps * (1 - trendHitPct / 100));
  const scaled = outcome({
    clientRps: trendRps,
    hitPct: trendHitPct,
    servers: scaledServers,
    staleMin: Math.min(batchMin, TRENDING_STALE_MIN),
    cached: true,
    trending: true,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: `${queriesB}B searches a day, a request per keystroke`,
        note: `${queriesB}B searches at ${keystrokes} keystrokes each is ${raw.clientRps.toLocaleString("en-US")} requests a second. With no debounce and no cache every one reaches a trie server, which takes ${raw.trieServers} servers at ${TARGET_LOAD * 100}% load.`,
        metrics: raw,
      },
      {
        beat: "component",
        title: "v1: debounce, cache, pre-computed trie",
        note: `Debounce removes ${debouncePct}% of requests and the cache answers ${cacheHitPct}% of the rest, so ${v1.trieRps.toLocaleString("en-US")} lookups a second reach ${v1.trieServers} trie servers (${v1.trieLoadPct}% load). Average latency is ${v1.latencyMs} ms and the trie is refreshed every ${batchMin} minutes.`,
        metrics: v1,
      },
      {
        beat: "failure",
        title: `A trending event: requests x${spike}`,
        note: `The new queries are not in the cache (hit rate falls to ${trending.cacheHitPct}%) and not in the trie until the next refresh. ${trending.trieRps.toLocaleString("en-US")} lookups a second hit ${trending.trieServers} servers: ${trending.trieLoadPct}% load. People see stale or missing suggestions for up to ${batchMin} minutes.`,
        metrics: trending,
      },
      {
        beat: "tradeoff",
        title: "A trending pipeline, and more trie servers",
        note: `A fast pipeline makes rising queries visible in ${scaled.staleMin} minutes instead of ${batchMin}, and ${scaled.trieServers} trie servers carry the spike at ${scaled.trieLoadPct}% load. It costs $${scaled.monthlyCostUsd.toLocaleString("en-US")} a month, against $${v1.monthlyCostUsd.toLocaleString("en-US")} for v1.`,
        metrics: scaled,
      },
    ],
    summary: { rawServers: raw.trieServers, v1Servers, scaledServers },
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
