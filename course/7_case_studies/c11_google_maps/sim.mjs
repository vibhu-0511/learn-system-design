// c11 sim: a maps service's tile and routing paths, from requirements to a 10x day.
// Assumptions: the vault note gives 1B daily users, 10 map views each, 15 tiles per view, 500M
// routes a day, 50 KB raster tiles and 30 KB vector tiles, an 80% browser hit rate, a 95% CDN hit
// rate, 50 ms from an edge and 150 ms from the origin, 500 ms with no cache, 45 s for a plain
// Dijkstra route and a 1000x speed-up from contraction hierarchies. Assumed here: traffic is the
// daily average (no peak factor), the tile origin serves 200,000 requests a second, one route
// search uses one core, a vector tile costs the phone 15 ms to draw, and a map-style change makes
// the CDN's hit rate fall to a value you set (default 20%) because every raster tile is stale.
// Runs in Node (node sim.mjs --spikeMultiplier=5) and in the browser.

export const PARAMS = {
  dauM: { label: "Daily users", unit: "M", min: 100, max: 2000, step: 100, default: 1000 },
  viewsPerUser: { label: "Map views per user per day", unit: "", min: 1, max: 30, step: 1, default: 10 },
  tilesPerView: { label: "Tiles per view", unit: "", min: 4, max: 30, step: 1, default: 15 },
  browserHitPct: { label: "Browser cache hit rate", unit: "%", min: 0, max: 95, step: 5, default: 80 },
  cdnHitPct: { label: "CDN hit rate", unit: "%", min: 50, max: 99, step: 1, default: 95 },
  routesPerDayM: { label: "Routes per day", unit: "M", min: 50, max: 2000, step: 50, default: 500 },
  spikeMultiplier: { label: "Traffic spike", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  coldHitPct: { label: "CDN hit rate after a style change", unit: "%", min: 0, max: 90, step: 5, default: 20 },
};

const RASTER_KB = 50;
const VECTOR_KB = 30;
const EDGE_MS = 50;
const ORIGIN_MS = 150;
const NO_CACHE_MS = 500;
const DIJKSTRA_MS = 45000;
const HIERARCHY_SPEEDUP = 1000;
const ORIGIN_CAP_RPS = 200000;
const VECTOR_DRAW_MS = 15;
const round1 = (n) => Math.round(n * 10) / 10;

function tiles({ viewsRps, tilesPerView, browserHit, cdnHit, kb }) {
  const tileRps = viewsRps * tilesPerView * (1 - browserHit);
  const originRps = tileRps * (1 - cdnHit);
  return {
    tileRps: Math.round(tileRps),
    originRps: Math.round(originRps),
    originUtilPct: Math.round((originRps / ORIGIN_CAP_RPS) * 100),
    egressGBps: round1((tileRps * kb) / 1e6),
    tileMs: browserHit === 0 && cdnHit === 0 ? NO_CACHE_MS : Math.round((1 - browserHit) * (cdnHit * EDGE_MS + (1 - cdnHit) * ORIGIN_MS)),
  };
}

function routes(routeRps, ms) {
  return { routeMs: ms, routeCores: Math.ceil((routeRps * ms) / 1000) };
}

export function run({ dauM, viewsPerUser, tilesPerView, browserHitPct, cdnHitPct, routesPerDayM, spikeMultiplier, coldHitPct }) {
  const viewsRps = (dauM * 1e6 * viewsPerUser) / 86400;
  const routeRps = (routesPerDayM * 1e6) / 86400;
  const browserHit = browserHitPct / 100;
  const cdnHit = cdnHitPct / 100;
  const hierarchyMs = DIJKSTRA_MS / HIERARCHY_SPEEDUP;
  const t = { viewsRps, tilesPerView };

  const naive = { ...tiles({ ...t, browserHit: 0, cdnHit: 0, kb: RASTER_KB }), ...routes(routeRps, DIJKSTRA_MS), clientRenderMs: 0 };
  const v1 = { ...tiles({ ...t, browserHit, cdnHit, kb: RASTER_KB }), ...routes(routeRps, hierarchyMs), clientRenderMs: 0 };
  const big = { viewsRps: viewsRps * spikeMultiplier, tilesPerView };
  const spiked = {
    ...tiles({ ...big, browserHit, cdnHit: coldHitPct / 100, kb: RASTER_KB }),
    ...routes(routeRps * spikeMultiplier, hierarchyMs), clientRenderMs: 0,
  };
  const vector = {
    ...tiles({ ...big, browserHit, cdnHit, kb: VECTOR_KB }),
    ...routes(routeRps * spikeMultiplier, hierarchyMs), clientRenderMs: VECTOR_DRAW_MS,
  };

  return {
    frames: [
      {
        beat: "constraints",
        title: "Requirements, and drawing maps on demand",
        note: `${dauM}M users with ${viewsPerUser} views of ${tilesPerView} tiles is ${naive.tileRps.toLocaleString("en-US")} tile requests a second, ${naive.egressGBps} GB/s of ${RASTER_KB} KB tiles, plus ${Math.round(routeRps).toLocaleString("en-US")} routes a second. Drawing each tile from the database takes ${naive.tileMs} ms and loads the origin to ${naive.originUtilPct}%; a plain Dijkstra search takes ${DIJKSTRA_MS / 1000} s and ${naive.routeCores.toLocaleString("en-US")} busy cores.`,
        metrics: naive,
      },
      {
        beat: "component",
        title: "Pre-rendered tiles, caches, hierarchical routing",
        note: `Tiles are drawn ahead of time and stored, so a request is a file fetch. The browser absorbs ${browserHitPct}%, the CDN ${cdnHitPct}% of the rest, and only ${v1.originRps.toLocaleString("en-US")} requests a second (${v1.originUtilPct}%) reach the origin, at ${v1.tileMs} ms average. Contraction hierarchies precompute shortcuts, so a route takes ${v1.routeMs} ms and ${v1.routeCores} cores.`,
        metrics: v1,
      },
      {
        beat: "failure",
        title: `${spikeMultiplier}x traffic and a new map style`,
        note: `A style change makes every raster tile stale, so the CDN hit rate falls to ${coldHitPct}% just as traffic is ${spikeMultiplier}x. The origin is asked for ${spiked.originRps.toLocaleString("en-US")} requests a second, ${spiked.originUtilPct}% of what it can serve. Routing copes: ${spiked.routeCores.toLocaleString("en-US")} cores.`,
        metrics: spiked,
      },
      {
        beat: "tradeoff",
        title: "Vector tiles: data cached, drawing on the phone",
        note: `Tiles carry road data (${VECTOR_KB} KB instead of ${RASTER_KB}), and the phone draws them. A restyle no longer invalidates the cache, so the hit rate stays at ${cdnHitPct}% and the origin is back to ${vector.originUtilPct}%. Egress is ${vector.egressGBps} GB/s instead of ${spiked.egressGBps}. The price is ${vector.clientRenderMs} ms of drawing work on every phone.`,
        metrics: vector,
      },
    ],
    summary: { originUtilPct: vector.originUtilPct, routeMs: hierarchyMs },
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
