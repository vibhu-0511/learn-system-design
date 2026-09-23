// f04 sim: a pool of workers serving requests from one shared queue.
// Assumptions: steady arrivals, one queue, every worker equally fast.
// Simplification: real multi-worker queues need Erlang C; scaling the wait by
// utilization shows the same cliff with much less math.
// Runs in Node (node sim.mjs --arrivalRate=950) and in the browser.

export const PARAMS = {
  arrivalRate: { label: "Arrival rate", unit: "req/s", min: 100, max: 5000, step: 50, default: 800 },
  serviceMs: { label: "Work per request", unit: "ms", min: 2, max: 50, step: 1, default: 10 },
  workers: { label: "Workers", unit: "", min: 1, max: 40, step: 1, default: 10 },
  batchSize: { label: "Batch size", unit: "requests", min: 1, max: 50, step: 1, default: 20 },
};

const TIMEOUT_MS = 5000;
const P99_FACTOR = Math.log(100); // for an exponential wait, p99 = mean * ln(100)
const BATCH_SAVING = 0.6; // batching makes each request 40% cheaper to serve
const round1 = (n) => Math.round(n * 10) / 10;

function measure(arrival, serviceMs, workers, extraMs = 0) {
  const capacity = (workers * 1000) / serviceMs;
  const utilization = arrival / capacity;
  const avg = utilization >= 1 ? TIMEOUT_MS : Math.min(serviceMs / (1 - utilization) + extraMs, TIMEOUT_MS);
  const throughput = Math.min(arrival, capacity);
  return {
    capacityRps: round1(capacity),
    utilizationPct: round1(utilization * 100),
    avgLatencyMs: round1(avg),
    p99LatencyMs: round1(Math.min(avg * P99_FACTOR, TIMEOUT_MS)),
    throughputRps: round1(throughput),
    inFlight: round1((throughput * avg) / 1000), // Little's Law: L = throughput x latency
    droppedRps: round1(Math.max(0, arrival - capacity)),
  };
}

export function run({ arrivalRate, serviceMs, workers, batchSize }) {
  const base = measure(arrivalRate, serviceMs, workers);
  const doubled = measure(arrivalRate, serviceMs, workers * 2);
  const spike = measure(arrivalRate * 3, serviceMs, workers);

  // Batching: cheaper per request, but each request waits for its batch to fill.
  // The wait is worst when traffic is quiet, so measure it off-peak (1/8 of the load).
  const offPeak = arrivalRate / 8;
  const fillMs = ((batchSize - 1) / (2 * offPeak)) * 1000;
  const factor = batchSize > 1 ? BATCH_SAVING : 1;
  const unbatchedQuiet = measure(offPeak, serviceMs, workers);
  const batchedQuiet = measure(offPeak, serviceMs * factor, workers, fillMs);

  return {
    frames: [
      {
        beat: "constraints",
        title: `${workers} workers, steady load`,
        note: `${arrivalRate} req/s against a capacity of ${base.capacityRps} req/s. Each request needs ${serviceMs} ms of work but also waits in line.`,
        metrics: base,
      },
      {
        beat: "component",
        title: "Double the workers",
        note: `Twice the capacity halves utilization, so the average wait falls from ${base.avgLatencyMs} ms to ${doubled.avgLatencyMs} ms.`,
        metrics: doubled,
      },
      {
        beat: "failure",
        title: "Traffic triples",
        note:
          spike.droppedRps > 0
            ? `Demand exceeds capacity by ${spike.droppedRps} req/s. The queue never drains and those requests time out.`
            : `Utilization reaches ${spike.utilizationPct}% and latency climbs to ${spike.avgLatencyMs} ms, but the system still keeps up.`,
        metrics: spike,
      },
      {
        beat: "tradeoff",
        title: "Batch requests, quiet hours",
        note: `Batching lifts capacity to ${batchedQuiet.capacityRps} req/s, but at quiet-hour traffic each request waits ${round1(fillMs)} ms for its batch to fill: ${unbatchedQuiet.avgLatencyMs} ms becomes ${batchedQuiet.avgLatencyMs} ms.`,
        metrics: batchedQuiet,
      },
    ],
    summary: { avgLatencyMs: base.avgLatencyMs, p99LatencyMs: base.p99LatencyMs, spikeDroppedRps: spike.droppedRps },
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
