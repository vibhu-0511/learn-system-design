// t02 sim: a decision calculator for batching work, the vault note's core latency/throughput lever.
// Assumptions: items arrive at `arrivalRps`; the worker handles them in batches, and a batch of B
// costs `overheadMs` (a network round trip, a disk sync) plus B x `perItemMs`; an item waits on
// average (B - 1) / 2 arrival gaps for its batch to fill; the latency shown is that wait plus the
// batch time when the worker keeps up (when it does not, the queue grows without bound); the
// worker needs `headroomPct` spare capacity; Little's law gives items in flight = rate x latency.
// Runs in Node (node sim.mjs --arrivalRps=2000) and in the browser.

export const PARAMS = {
  arrivalRps: { label: "Arrival rate", unit: "req/s", min: 50, max: 5000, step: 50, default: 500 },
  overheadMs: { label: "Fixed cost per batch", unit: "ms", min: 1, max: 100, step: 1, default: 10 },
  perItemMs: { label: "Work per item", unit: "ms", min: 0.1, max: 5, step: 0.1, default: 1 },
  sloMs: { label: "Latency target", unit: "ms", min: 10, max: 2000, step: 10, default: 100 },
  bigBatch: { label: "A large batch", unit: "items", min: 10, max: 2000, step: 10, default: 500 },
  headroomPct: { label: "Spare capacity wanted", unit: "%", min: 0, max: 50, step: 5, default: 20 },
};

const MAX_BATCH = 5000;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome(batch, { arrivalRps, overheadMs, perItemMs }) {
  const batchMs = overheadMs + batch * perItemMs;
  const capacityRps = (batch / batchMs) * 1000;
  const latencyMs = ((batch - 1) / 2 / arrivalRps) * 1000 + batchMs;
  return {
    batchSize: batch,
    latencyMs: Math.round(latencyMs),
    capacityRps: Math.round(capacityRps),
    utilizationPct: Math.round((arrivalRps / capacityRps) * 100),
    itemsInFlight: round1((arrivalRps * latencyMs) / 1000),
  };
}

export function run(params) {
  const { arrivalRps, sloMs, bigBatch, headroomPct } = params;
  const target = arrivalRps * (1 + headroomPct / 100);
  let best = MAX_BATCH;
  for (let b = 1; b <= MAX_BATCH; b++) {
    if (outcome(b, params).capacityRps >= target) {
      best = b;
      break;
    }
  }

  const single = outcome(1, params);
  const large = outcome(bigBatch, params);
  const tuned = outcome(best, params);
  const fmt = (n) => n.toLocaleString("en-US");

  return {
    frames: [
      {
        beat: "constraints",
        title: `${fmt(arrivalRps)} items a second, a ${sloMs} ms target`,
        note: `Each batch costs ${params.overheadMs} ms of fixed work plus ${params.perItemMs} ms an item. Fewer items per batch means a shorter wait; more means less fixed cost per item. You need at least ${fmt(Math.round(target))} items a second of capacity.`,
        metrics: { batchSize: 0, latencyMs: 0, capacityRps: 0, utilizationPct: 0, itemsInFlight: 0 },
      },
      {
        beat: "component",
        title: "One item at a time: lowest latency",
        note: `Every item pays the ${params.overheadMs} ms overhead alone: ${single.latencyMs} ms each, but only ${fmt(single.capacityRps)} items a second of capacity against ${fmt(arrivalRps)} arriving (${single.utilizationPct}% utilised). ${single.utilizationPct > 100 ? "The queue grows without bound." : "It keeps up."}`,
        metrics: single,
      },
      {
        beat: "failure",
        title: `Batches of ${fmt(bigBatch)}: best throughput, slow items`,
        note: `Capacity is ${fmt(large.capacityRps)} a second, but an item waits for its batch to fill and then for the batch: ${fmt(large.latencyMs)} ms on average, ${large.latencyMs > sloMs ? `${Math.round(large.latencyMs / sloMs * 10) / 10} times` : "within"} the ${sloMs} ms target.`,
        metrics: large,
      },
      {
        beat: "tradeoff",
        title: `The smallest batch that keeps up: ${fmt(best)}`,
        note: `A batch of ${fmt(best)} gives ${fmt(tuned.capacityRps)} items a second (${tuned.utilizationPct}% utilised) at ${fmt(tuned.latencyMs)} ms, ${tuned.latencyMs <= sloMs ? "inside" : "outside"} the ${sloMs} ms target. Bigger only adds wait; smaller cannot keep up. ${fmt(tuned.itemsInFlight)} items are in flight at any moment.`,
        metrics: tuned,
      },
    ],
    summary: { bestBatch: best, latencyMs: tuned.latencyMs },
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
