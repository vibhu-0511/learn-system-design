// p13 sim: one service calling several dependencies from a shared thread pool, or from one
// pool per dependency (a bulkhead).
// Assumptions: requests spread evenly over `deps` dependencies and each request is one call; a
// healthy call holds a thread for 50 ms and the hung dependency holds it for `hungMs`; thread
// demand is rate x hold time (Little's law); when demand exceeds a pool, requests get through in
// proportion to the pool's size and the rest are rejected; a bulkhead gives each dependency
// `poolSize / deps` threads, and the "roomier" one gives each twice that; the first dependency is
// the one that hangs, or spikes to `spikeX` times its normal traffic.
// Runs in Node (node sim.mjs --hungMs=60000) and in the browser.

export const PARAMS = {
  deps: { label: "Dependencies", unit: "", min: 2, max: 20, step: 1, default: 10 },
  poolSize: { label: "Threads in total", unit: "", min: 20, max: 1000, step: 20, default: 200 },
  rps: { label: "Requests", unit: "per s", min: 50, max: 2000, step: 50, default: 400 },
  hungMs: { label: "Hung dependency's response time", unit: "ms", min: 100, max: 60000, step: 100, default: 25000 },
  spikeX: { label: "Traffic spike to one dependency", unit: "x", min: 1, max: 50, step: 1, default: 15 },
};

const HEALTHY_MS = 50;

function evaluate({ deps, rps, hungMs, spikeX, hung, spike, pools }) {
  const base = rps / deps;
  const rate = Array.from({ length: deps }, (_, i) => (i === 0 && spike ? base * spikeX : base));
  const holdMs = Array.from({ length: deps }, (_, i) => (i === 0 && hung ? hungMs : HEALTHY_MS));
  const demand = rate.map((r, i) => (r * holdMs[i]) / 1000);
  const shared = pools.length === 1;
  const totalDemand = demand.reduce((a, b) => a + b, 0);
  const served = demand.map((d, i) => (shared ? Math.min(1, pools[0] / totalDemand) : Math.min(1, pools[i] / d)));

  const failed = rate.map((r, i) => r * (1 - served[i]));
  const from = hung ? 1 : 0;
  const sum = (xs) => xs.slice(from).reduce((a, b) => a + b, 0);
  return {
    failedRequestsPct: Math.round((failed.reduce((a, b) => a + b, 0) / rate.reduce((a, b) => a + b, 0)) * 100),
    healthyDepsFailedPct: Math.round((sum(failed) / sum(rate)) * 100),
    threadsHeldByHung: hung ? Math.round(Math.min(pools[0], demand[0])) : 0,
    totalThreads: Math.round(pools.reduce((a, b) => a + b, 0)),
  };
}

export function run({ deps, poolSize, rps, hungMs, spikeX }) {
  const each = poolSize / deps;
  const common = { deps, rps, hungMs, spikeX };

  const sharedHung = evaluate({ ...common, hung: true, spike: false, pools: [poolSize] });
  const isolatedHung = evaluate({ ...common, hung: true, spike: false, pools: Array(deps).fill(each) });
  const isolatedSpike = evaluate({ ...common, hung: false, spike: true, pools: Array(deps).fill(each) });
  const roomySpike = evaluate({ ...common, hung: false, spike: true, pools: Array(deps).fill(each * 2) });

  return {
    frames: [
      {
        beat: "constraints",
        title: `One shared pool of ${poolSize} threads, one hung dependency`,
        note: `Dependency 1 of ${deps} takes ${(hungMs / 1000).toLocaleString("en-US")} s instead of 50 ms. Its calls take all ${sharedHung.threadsHeldByHung} threads, so ${sharedHung.failedRequestsPct}% of requests fail, and ${sharedHung.healthyDepsFailedPct}% of the requests to the ${deps - 1} healthy dependencies fail too.`,
        metrics: sharedHung,
      },
      {
        beat: "component",
        title: `A bulkhead: ${Math.round(each * 10) / 10} threads per dependency`,
        note: `Each dependency has its own compartment. The hung one can hold only ${isolatedHung.threadsHeldByHung} threads, so ${isolatedHung.failedRequestsPct}% of requests fail (its own) and the healthy dependencies lose ${isolatedHung.healthyDepsFailedPct}%.`,
        metrics: isolatedHung,
      },
      {
        beat: "failure",
        title: `A healthy dependency spikes ${spikeX}x`,
        note: `Its compartment holds only ${Math.round(each * 10) / 10} threads, so ${isolatedSpike.failedRequestsPct}% of requests are rejected even though the other compartments sit mostly idle. Spare capacity in one pool cannot help another.`,
        metrics: isolatedSpike,
      },
      {
        beat: "tradeoff",
        title: "Bigger compartments",
        note: `Doubling each pool cuts the spike's rejections to ${roomySpike.failedRequestsPct}%, but the service now reserves ${roomySpike.totalThreads} threads instead of ${poolSize}, and a hung dependency can hold twice as many. Each bulkhead is a sizing decision to keep up to date.`,
        metrics: roomySpike,
      },
    ],
    summary: { sharedHealthyFailedPct: sharedHung.healthyDepsFailedPct, isolatedHealthyFailedPct: isolatedHung.healthyDepsFailedPct },
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
