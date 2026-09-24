// p14 sim: a consumer that can do `capacityRps` a second facing a surge of `arrivalRps` for `surgeSec`.
// Assumptions: time runs in one-second steps; the queue is first in, first out, and after the
// surge it drains; a request that waits longer than `timeoutSec` has been abandoned by its client,
// but is still processed (wasted work); an item takes `itemKb` of memory; a full queue rejects new
// requests at once (they are shed).
// Runs in Node (node sim.mjs --surgeSec=60) and in the browser.

export const PARAMS = {
  capacityRps: { label: "Consumer capacity", unit: "req/s", min: 100, max: 5000, step: 100, default: 1000 },
  arrivalRps: { label: "Arrivals during the surge", unit: "req/s", min: 500, max: 10000, step: 100, default: 1500 },
  surgeSec: { label: "Surge length", unit: "s", min: 5, max: 120, step: 5, default: 30 },
  timeoutSec: { label: "Client timeout", unit: "s", min: 1, max: 30, step: 1, default: 3 },
  queueLimit: { label: "Queue limit", unit: "items", min: 100, max: 20000, step: 100, default: 2000 },
  itemKb: { label: "Memory per queued item", unit: "KB", min: 1, max: 64, step: 1, default: 2 },
};

const round1 = (n) => Math.round(n * 10) / 10;

function surge({ capacityRps, arrivalRps, surgeSec, timeoutSec, itemKb }, limit) {
  const budget = timeoutSec * capacityRps;
  let queue = 0;
  let peak = 0;
  let accepted = 0;
  let wasted = 0;
  for (let t = 0; t < surgeSec; t++) {
    const take = Math.min(arrivalRps, Math.max(0, limit - queue));
    wasted += Math.max(0, Math.min(take, queue + take - Math.max(queue, budget)));
    accepted += take;
    peak = Math.max(peak, queue + take);
    queue = Math.max(0, queue + take - capacityRps);
  }
  return {
    droppedPct: Math.round((1 - accepted / (arrivalRps * surgeSec)) * 100),
    wastedWorkPct: accepted ? Math.round((wasted / accepted) * 100) : 0,
    peakWaitSec: round1(peak / capacityRps),
    peakMemoryMb: round1((peak * itemKb) / 1024),
  };
}

export function run(params) {
  const { capacityRps, arrivalRps, surgeSec, timeoutSec, queueLimit } = params;
  const unbounded = surge(params, Infinity);
  const bounded = surge(params, queueLimit);
  const tooBig = surge(params, queueLimit * 4);
  const budgetLimit = timeoutSec * capacityRps;
  const sized = surge(params, budgetLimit);

  return {
    frames: [
      {
        beat: "constraints",
        title: "An unbounded queue",
        note: `${arrivalRps.toLocaleString("en-US")} requests a second arrive for ${surgeSec} s at a consumer that handles ${capacityRps.toLocaleString("en-US")}. Nothing is refused, so the queue grows to a ${unbounded.peakWaitSec} s wait and ${unbounded.peakMemoryMb} MB, and ${unbounded.wastedWorkPct}% of the work is for clients that already timed out (${timeoutSec} s).`,
        metrics: unbounded,
      },
      {
        beat: "component",
        title: `A bounded queue of ${queueLimit.toLocaleString("en-US")}, excess rejected`,
        note: `A full queue rejects new requests at once. Memory stays at ${bounded.peakMemoryMb} MB and no request waits more than ${bounded.peakWaitSec} s, at the cost of rejecting ${bounded.droppedPct}% of the surge, and rejection is the signal for producers to slow down.`,
        metrics: bounded,
      },
      {
        beat: "failure",
        title: `A limit of ${(queueLimit * 4).toLocaleString("en-US")} is too generous`,
        note: `Queued items wait up to ${tooBig.peakWaitSec} s, longer than the ${timeoutSec} s clients allow. The queue stays full of requests nobody is waiting for: ${tooBig.wastedWorkPct}% of the work is wasted, and only ${tooBig.droppedPct}% is rejected.`,
        metrics: tooBig,
      },
      {
        beat: "tradeoff",
        title: `Size the queue to the timeout: ${budgetLimit.toLocaleString("en-US")}`,
        note: `Capacity times the timeout (${capacityRps.toLocaleString("en-US")} x ${timeoutSec} s) is the most a queue can hold and still serve everything before clients give up: ${sized.wastedWorkPct}% wasted, wait ${sized.peakWaitSec} s. The price is shedding ${sized.droppedPct}% of the surge instead of delaying it.`,
        metrics: sized,
      },
    ],
    summary: { unboundedWaitSec: unbounded.peakWaitSec, sizedDroppedPct: sized.droppedPct },
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
