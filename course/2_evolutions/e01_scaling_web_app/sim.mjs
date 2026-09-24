// e01 sim: one web app growing through its first scaling stages.
// Capacities and prices are the ballpark figures from the vault note: an app server
// handles about 1,000 req/s, a database about 5,000 queries/s, and a server, load
// balancer, cache and database cost roughly $30, $20, $100 and $200 a month.
// Assumptions: app servers are sized to run at 70% utilization; every read that misses
// the cache, and every write, is one database query; replicas lag the primary by 100 ms.
// Runs in Node (node sim.mjs --peakRps=8000) and in the browser.

export const PARAMS = {
  peakRps: { label: "Peak traffic", unit: "req/s", min: 200, max: 20000, step: 200, default: 4000 },
  readPct: { label: "Requests that only read", unit: "%", min: 50, max: 99, step: 1, default: 90 },
  hitRatePct: { label: "Cache hit rate", unit: "%", min: 50, max: 99, step: 1, default: 95 },
  replicas: { label: "Read replicas", unit: "", min: 1, max: 6, step: 1, default: 2 },
};

const APP_RPS = 1000;
const DB_RPS = 5000;
const HEADROOM = 0.7;
const GROWTH = 10;
const LAG_MS = 100;
const COST = { server: 30, loadBalancer: 20, cache: 100, database: 200 };
const round1 = (n) => Math.round(n * 10) / 10;

const serversFor = (load) => Math.ceil(load / (APP_RPS * HEADROOM));

function measure({ load, servers, cost, dbLoad, replicaLoad = 0, staleMs = 0 }) {
  return {
    appServers: servers,
    appUtilizationPct: round1((load / (servers * APP_RPS)) * 100),
    dbUtilizationPct: round1((dbLoad / DB_RPS) * 100),
    replicaUtilizationPct: round1((replicaLoad / DB_RPS) * 100),
    monthlyCostUsd: cost,
    staleReadMs: staleMs,
  };
}

export function run({ peakRps, readPct, hitRatePct, replicas }) {
  const readShare = readPct / 100;
  const hit = hitRatePct / 100;
  const writes = peakRps * (1 - readShare);
  const readMisses = peakRps * readShare * (1 - hit);

  const one = measure({ load: peakRps, servers: 1, cost: COST.server, dbLoad: peakRps });

  const servers = serversFor(peakRps);
  const stackCost = (n, extraReplicas = 0) => n * COST.server + COST.loadBalancer + COST.cache + COST.database * (1 + extraReplicas);
  const stack = measure({ load: peakRps, servers, cost: stackCost(servers), dbLoad: writes + readMisses });

  const grown = measure({ load: peakRps * GROWTH, servers, cost: stackCost(servers), dbLoad: (writes + readMisses) * GROWTH });

  const bigServers = serversFor(peakRps * GROWTH);
  const replicated = measure({
    load: peakRps * GROWTH,
    servers: bigServers,
    cost: stackCost(bigServers, replicas),
    dbLoad: writes * GROWTH,
    replicaLoad: (readMisses * GROWTH) / replicas,
    staleMs: LAG_MS,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: "One server does everything",
        note: `${peakRps} req/s against one box that handles ${APP_RPS}: the app tier runs at ${one.appUtilizationPct}% and the database shares the same machine.`,
        metrics: one,
      },
      {
        beat: "component",
        title: "Load balancer, app servers and a cache",
        note: `${servers} app servers behind a load balancer, and a ${hitRatePct}% hit-rate cache cut database queries to ${round1(writes + readMisses)}/s (${stack.dbUtilizationPct}% of the database) for $${stack.monthlyCostUsd} a month.`,
        metrics: stack,
      },
      {
        beat: "failure",
        title: `Traffic grows ${GROWTH}x`,
        note: `The same stack now sees ${peakRps * GROWTH} req/s: the ${servers} app servers run at ${grown.appUtilizationPct}% and the database at ${grown.dbUtilizationPct}%. ${grown.dbUtilizationPct >= 100 ? "Both tiers are past capacity." : "The app tier fails first."}`,
        metrics: grown,
      },
      {
        beat: "tradeoff",
        title: `Add ${replicas} read replicas`,
        note: `Cache misses now go to replicas, so the primary only takes writes (${replicated.dbUtilizationPct}%). The cost is ${replicated.staleReadMs} ms of replication lag on reads and $${replicated.monthlyCostUsd} a month, and writes are still one machine's problem.`,
        metrics: replicated,
      },
    ],
    summary: { stackCostUsd: stack.monthlyCostUsd, grownDbUtilizationPct: grown.dbUtilizationPct },
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
