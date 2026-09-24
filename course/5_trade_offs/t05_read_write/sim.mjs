// t05 sim: a decision calculator for an analytics dashboard and its event ingestion.
// Assumptions: the vault note's numbers: a dashboard that takes 5 seconds with raw tables and
// 200 ms once it is denormalised, cached and backed by materialized views; writes that run at
// 50,000 a second on bare tables and 5,000 a second once every write updates 12 indexes,
// invalidates 8 cache keys and refreshes 4 views. The per-write costs are chosen to reproduce
// that: 0.02 ms base, 0.005 ms per index, 0.005 ms per cache invalidation, 0.02 ms per view refresh.
// The decoupled design keeps only `essentialIndexes` on the write path and refreshes the views and
// cache from a batch every `refreshSec` seconds, so it costs no per-write invalidation or refresh.
// Runs in Node (node sim.mjs --ingestGrowthX=3) and in the browser.

export const PARAMS = {
  eventsPerSec: { label: "Events now", unit: "per s", min: 100, max: 30000, step: 100, default: 3000 },
  ingestGrowthX: { label: "Ingestion growth", unit: "x", min: 1, max: 20, step: 1, default: 7 },
  indexes: { label: "Indexes", unit: "", min: 1, max: 20, step: 1, default: 12 },
  cacheKeys: { label: "Cache keys per write", unit: "", min: 0, max: 20, step: 1, default: 8 },
  views: { label: "Materialized views", unit: "", min: 0, max: 10, step: 1, default: 4 },
  essentialIndexes: { label: "Indexes kept on the write path", unit: "", min: 1, max: 6, step: 1, default: 3 },
  refreshSec: { label: "Refresh interval", unit: "s", min: 1, max: 300, step: 1, default: 30 },
};

const BASE_MS = 0.02;
const INDEX_MS = 0.005;
const INVALIDATE_MS = 0.005;
const VIEW_MS = 0.02;
const RAW_DASHBOARD_MS = 5000;
const FAST_DASHBOARD_MS = 200;

function outcome({ dashboardMs, writeMs, events, staleSec }) {
  const capacity = 1000 / writeMs;
  return {
    dashboardMs,
    writeCapacityRps: Math.round(capacity),
    writeLoadPct: Math.round((events / capacity) * 100),
    stalenessSec: staleSec,
  };
}

export function run({ eventsPerSec, ingestGrowthX, indexes, cacheKeys, views, essentialIndexes, refreshSec }) {
  const grown = eventsPerSec * ingestGrowthX;
  const fmt = (n) => n.toLocaleString("en-US");
  const fullWriteMs = BASE_MS + indexes * INDEX_MS + cacheKeys * INVALIDATE_MS + views * VIEW_MS;

  const raw = outcome({ dashboardMs: RAW_DASHBOARD_MS, writeMs: BASE_MS, events: eventsPerSec, staleSec: 0 });
  const readOpt = outcome({ dashboardMs: FAST_DASHBOARD_MS, writeMs: fullWriteMs, events: eventsPerSec, staleSec: 0 });
  const overloaded = outcome({ dashboardMs: FAST_DASHBOARD_MS, writeMs: fullWriteMs, events: grown, staleSec: 0 });
  const decoupled = outcome({ dashboardMs: FAST_DASHBOARD_MS, writeMs: BASE_MS + essentialIndexes * INDEX_MS, events: grown, staleSec: refreshSec });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Raw tables: slow reads, fast writes",
        note: `The dashboard takes ${fmt(raw.dashboardMs)} ms and users complain, while bare tables can take ${fmt(raw.writeCapacityRps)} writes a second (${raw.writeLoadPct}% used at ${fmt(eventsPerSec)}). The system is mostly read, so reads get the effort.`,
        metrics: raw,
      },
      {
        beat: "component",
        title: `Optimise reads: ${indexes} indexes, ${cacheKeys} cache keys, ${views} views`,
        note: `The dashboard drops to ${readOpt.dashboardMs} ms. Every write now updates ${indexes} indexes, invalidates ${cacheKeys} cache keys and refreshes ${views} views, so write capacity is ${fmt(readOpt.writeCapacityRps)} a second (${readOpt.writeLoadPct}% used).`,
        metrics: readOpt,
      },
      {
        beat: "failure",
        title: `Ingestion grows ${ingestGrowthX}x to ${fmt(grown)} events a second`,
        note: `The same design can write ${fmt(overloaded.writeCapacityRps)} a second, so at ${fmt(grown)} it is ${overloaded.writeLoadPct}% used and the pipeline falls behind. The read optimisation quietly used up the write budget.`,
        metrics: overloaded,
      },
      {
        beat: "tradeoff",
        title: `Keep the write path lean; refresh reads every ${refreshSec} s`,
        note: `Only ${essentialIndexes} indexes stay on the write path, and views and cache are rebuilt in batches. Capacity is ${fmt(decoupled.writeCapacityRps)} a second (${decoupled.writeLoadPct}% used at ${fmt(grown)}), the dashboard stays at ${decoupled.dashboardMs} ms, and its data is up to ${refreshSec} s old.`,
        metrics: decoupled,
      },
    ],
    summary: { readOptimisedCapacityRps: readOpt.writeCapacityRps, decoupledCapacityRps: decoupled.writeCapacityRps },
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
