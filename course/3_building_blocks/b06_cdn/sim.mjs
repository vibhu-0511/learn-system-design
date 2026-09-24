// b06 sim: serving content from an edge near the user.
// Scenario: a page of 20 resources and a few MB, opened by a user far from the origin.
// Assumptions: a page load is 3 setup round trips plus one wave per 6 resources, plus
// transfer time; a cache miss adds one round trip to the origin; an object is requested
// `objectRate` times a second on average, so its hit rate for a TTL of T is r*T / (1 + r*T)
// (the same model as b04). Prices are the vault note's: about $0.0001 per request served
// from origin and $0.00002 per request through a CDN.
// Runs in Node (node sim.mjs --ttlSeconds=600) and in the browser.

export const PARAMS = {
  originRttMs: { label: "Round trip to the origin", unit: "ms", min: 20, max: 300, step: 10, default: 200 },
  edgeRttMs: { label: "Round trip to the nearest edge", unit: "ms", min: 5, max: 50, step: 5, default: 20 },
  pageMb: { label: "Page size", unit: "MB", min: 0.5, max: 10, step: 0.5, default: 2 },
  requestsPerDay: { label: "Requests a day", unit: "", min: 100000, max: 100000000, step: 100000, default: 1000000 },
  objectRate: { label: "Requests per object", unit: "per s", min: 0.05, max: 5, step: 0.05, default: 0.5 },
  ttlSeconds: { label: "Cache TTL", unit: "s", min: 5, max: 600, step: 5, default: 60 },
};

const RESOURCES = 20;
const PARALLEL = 6;
const SETUP_RTTS = 3;
const MB_PER_SEC = 5; // a 40 Mbit/s connection
const ORIGIN_COST = 0.0001;
const CDN_COST = 0.00002;
const round1 = (n) => Math.round(n * 10) / 10;

const roundTrips = SETUP_RTTS + Math.ceil(RESOURCES / PARALLEL);
const hitRate = (rate, ttl) => (rate * ttl) / (1 + rate * ttl);

function outcome({ pageLoadMs, hit, requestsPerDay, staleMinutes, viaCdn }) {
  const misses = requestsPerDay * (1 - hit);
  return {
    pageLoadMs: Math.round(pageLoadMs),
    hitRatePct: round1(hit * 100),
    originRequestsPerDay: Math.round(misses),
    monthlyCostUsd: Math.round(30 * (misses * ORIGIN_COST + (viaCdn ? requestsPerDay * CDN_COST : 0))),
    maxStaleMin: round1(staleMinutes),
  };
}

export function run({ originRttMs, edgeRttMs, pageMb, requestsPerDay, objectRate, ttlSeconds }) {
  const transferMs = (pageMb / MB_PER_SEC) * 1000;
  const fromOrigin = roundTrips * originRttMs + transferMs;
  const fromEdge = roundTrips * edgeRttMs + transferMs;
  const withMiss = (hit) => fromEdge + (1 - hit) * originRttMs;

  const none = outcome({ pageLoadMs: fromOrigin, hit: 0, requestsPerDay, staleMinutes: 0, viaCdn: false });

  const warmHit = hitRate(objectRate, ttlSeconds);
  const warm = outcome({ pageLoadMs: withMiss(warmHit), hit: warmHit, requestsPerDay, staleMinutes: ttlSeconds / 60, viaCdn: true });

  const coldTtl = 5;
  const coldHit = hitRate(objectRate, coldTtl);
  const cold = outcome({ pageLoadMs: withMiss(coldHit), hit: coldHit, requestsPerDay, staleMinutes: coldTtl / 60, viaCdn: true });

  const longTtl = ttlSeconds * 60;
  const longHit = hitRate(objectRate, longTtl);
  const stale = outcome({ pageLoadMs: withMiss(longHit), hit: longHit, requestsPerDay, staleMinutes: longTtl / 60, viaCdn: true });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Every request goes to the origin",
        note: `${roundTrips} round trips at ${originRttMs} ms plus ${round1(transferMs)} ms of transfer: ${none.pageLoadMs} ms for a user far away, and the origin takes all ${requestsPerDay.toLocaleString("en-US")} requests.`,
        metrics: none,
      },
      {
        beat: "component",
        title: `A CDN edge, ${ttlSeconds} s TTL`,
        note: `Content is cached ${edgeRttMs} ms from the user. A ${warm.hitRatePct}% hit rate takes the page to ${warm.pageLoadMs} ms and cuts origin requests to ${warm.originRequestsPerDay.toLocaleString("en-US")} a day, for $${warm.monthlyCostUsd} a month.`,
        metrics: warm,
      },
      {
        beat: "failure",
        title: "The edge cache runs cold",
        note: `After a purge or with a ${coldTtl} s TTL the hit rate drops to ${cold.hitRatePct}%: ${cold.originRequestsPerDay.toLocaleString("en-US")} requests a day reach the origin, ${round1(cold.originRequestsPerDay / Math.max(1, warm.originRequestsPerDay))}x more, and the origin can be overwhelmed.`,
        metrics: cold,
      },
      {
        beat: "tradeoff",
        title: `A long TTL (${longTtl / 60} minutes)`,
        note: `The hit rate climbs to ${stale.hitRatePct}% and cost falls to $${stale.monthlyCostUsd} a month, but a changed file can be served ${stale.maxStaleMin} minutes stale unless you purge it or version its URL.`,
        metrics: stale,
      },
    ],
    summary: { originMs: none.pageLoadMs, edgeMs: warm.pageLoadMs },
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
