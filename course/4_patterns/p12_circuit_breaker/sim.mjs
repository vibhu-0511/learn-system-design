// p12 sim: one slow dependency, and whether it drags the whole service down with it.
// Assumptions: the service has `poolSize` worker threads, and each request holds a thread while it
// waits; `dependencySharePct` of requests need the slow dependency and the rest do not; a healthy
// call takes 50 ms and a slow one takes `slowMs` (callers wait for the timeout); demand for threads
// is rate x hold time (Little's law); when demand exceeds the pool, requests share the pool in
// proportion, and the rest are rejected; an open breaker fails dependency calls in 1 ms, and a
// `fallbackPct` share of them is answered from a fallback (cached or default data); the
// breaker stays open `openSec` and then lets one probe through; the dependency really recovers
// after `blipSec`.
// Runs in Node (node sim.mjs --slowMs=10000) and in the browser.

export const PARAMS = {
  rps: { label: "Requests", unit: "per s", min: 50, max: 2000, step: 50, default: 500 },
  poolSize: { label: "Worker threads", unit: "", min: 20, max: 1000, step: 20, default: 200 },
  slowMs: { label: "Slow dependency", unit: "ms", min: 100, max: 30000, step: 100, default: 5000 },
  dependencySharePct: { label: "Requests that need it", unit: "%", min: 5, max: 100, step: 5, default: 50 },
  fallbackPct: { label: "Answered from a fallback", unit: "%", min: 0, max: 100, step: 10, default: 60 },
  openSec: { label: "Breaker stays open", unit: "s", min: 1, max: 120, step: 1, default: 30 },
  blipSec: { label: "Dependency is really slow for", unit: "s", min: 1, max: 60, step: 1, default: 5 },
};

const HEALTHY_MS = 50;
const FAST_FAIL_MS = 1;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ demandThreads, poolSize, failedShare, waitMs, unneededOpenSec, callsRps }) {
  return {
    poolUsedPct: Math.round(Math.min(1, demandThreads / poolSize) * 100),
    failedRequestsPct: Math.round(failedShare * 100),
    dependencyWaitMs: waitMs,
    unneededOpenSec,
    dependencyCallsRps: round1(callsRps),
  };
}

export function run({ rps, poolSize, slowMs, dependencySharePct, fallbackPct, openSec, blipSec }) {
  const share = dependencySharePct / 100;
  const fallback = fallbackPct / 100;
  const otherThreads = (rps * (1 - share) * HEALTHY_MS) / 1000;
  const slowThreads = (rps * share * slowMs) / 1000;

  const demand = otherThreads + slowThreads;
  const noBreaker = outcome({
    demandThreads: demand,
    poolSize,
    failedShare: demand > poolSize ? 1 - poolSize / demand : 0,
    waitMs: slowMs,
    unneededOpenSec: 0,
    callsRps: rps * share,
  });

  const breaker = outcome({
    demandThreads: otherThreads,
    poolSize,
    failedShare: share * (1 - fallback),
    waitMs: FAST_FAIL_MS,
    unneededOpenSec: 0,
    callsRps: 1 / openSec,
  });

  const twitchy = { ...breaker, unneededOpenSec: Math.max(0, openSec - blipSec) };

  const shortOpen = Math.max(1, Math.round(openSec / 6));
  const probing = outcome({
    demandThreads: otherThreads,
    poolSize,
    failedShare: share * (1 - fallback),
    waitMs: FAST_FAIL_MS,
    unneededOpenSec: Math.max(0, shortOpen - blipSec),
    callsRps: 1 / shortOpen,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: `The dependency slows to ${slowMs.toLocaleString("en-US")} ms, no breaker`,
        note: `Each dependency call now holds a thread for ${slowMs / 1000} s, so the pool needs ${Math.round(demand).toLocaleString("en-US")} threads and has ${poolSize}. It is ${noBreaker.poolUsedPct}% used, and ${noBreaker.failedRequestsPct}% of ALL requests fail, including the ${100 - dependencySharePct}% that never touch the dependency.`,
        metrics: noBreaker,
      },
      {
        beat: "component",
        title: "A circuit breaker fails fast",
        note: `After enough failures the breaker opens and fails dependency calls in ${FAST_FAIL_MS} ms instead of waiting, so the pool drops to ${breaker.poolUsedPct}% used. Only the ${dependencySharePct}% of requests that need the dependency are hurt, and ${fallbackPct}% of those get a fallback answer: ${breaker.failedRequestsPct}% fail.`,
        metrics: breaker,
      },
      {
        beat: "failure",
        title: `A breaker that stays open ${openSec} s after a ${blipSec} s blip`,
        note: `The dependency recovers after ${blipSec} s, but the breaker keeps rejecting for ${twitchy.unneededOpenSec} s more: ${twitchy.failedRequestsPct}% of requests fail while the dependency is fine.`,
        metrics: twitchy,
      },
      {
        beat: "tradeoff",
        title: `Shorter open time (${shortOpen} s) with a probe`,
        note: `After ${shortOpen} s the breaker lets one request through to test the dependency, so a recovered one is used again quickly (${probing.unneededOpenSec} s wasted). If it is still down, each probe waits ${slowMs.toLocaleString("en-US")} ms and holds one thread. The fallback keeps ${fallbackPct}% of dependency users served, at the cost of stale or default data.`,
        metrics: probing,
      },
    ],
    summary: { withoutBreakerFailedPct: noBreaker.failedRequestsPct, withBreakerFailedPct: breaker.failedRequestsPct },
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
