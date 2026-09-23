// f04 sim: one server as a single queue. Placeholder model, replaced in P2.
// Assumption: requests arrive steadily and are served one at a time.
// Runs in Node (node sim.mjs --arrivalRate=80) and in the browser.

export const PARAMS = {
  arrivalRate: { label: "Arrival rate", unit: "req/s", min: 10, max: 190, step: 5, default: 80 },
  serviceRate: { label: "Service rate", unit: "req/s", min: 50, max: 400, step: 10, default: 100 },
};

const TIMEOUT_MS = 10000;
const round1 = (n) => Math.round(n * 10) / 10;

// Average time in system for a steady queue: 1 / (service - arrival), capped at a client timeout.
function latencyMs(arrival, service) {
  const spare = service - arrival;
  return spare > 0 ? Math.min(1000 / spare, TIMEOUT_MS) : TIMEOUT_MS;
}

function measure(arrival, service, extraMs = 0) {
  return {
    utilizationPct: round1((arrival / service) * 100),
    latencyMs: round1(latencyMs(arrival, service) + extraMs),
    throughput: round1(Math.min(arrival, service)),
  };
}

export function run({ arrivalRate, serviceRate }) {
  const base = measure(arrivalRate, serviceRate);
  const spike = measure(arrivalRate * 1.25, serviceRate);
  return {
    frames: [
      { beat: "constraints", title: "One server, steady load", note: "The server keeps up, but every request still waits behind others.", metrics: base },
      { beat: "component", title: "Add a second server", note: "Doubling service capacity cuts utilization and latency.", metrics: measure(arrivalRate, serviceRate * 2) },
      { beat: "failure", title: "A 25% traffic spike", note: "Near capacity, a small spike pushes latency to the timeout.", metrics: spike },
      { beat: "tradeoff", title: "Batch requests", note: "Batching raises capacity by 40% but adds a 25 ms wait to every request.", metrics: measure(arrivalRate, serviceRate * 1.4, 25) },
    ],
    summary: { baseLatencyMs: base.latencyMs, spikeLatencyMs: spike.latencyMs },
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
