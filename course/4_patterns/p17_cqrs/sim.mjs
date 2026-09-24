// p17 sim: one database for product pages and orders, then separate write and read models.
// Assumptions: the database has `cores` CPU cores; a read that joins five tables costs 40 ms of
// CPU and takes 800 ms to answer, an order write costs 10 ms of CPU, and a key lookup in the read
// model costs 0.5 ms of CPU and answers in 5 ms; when the database is over 100% used, latency
// grows in proportion; the read model is filled by a projector that trails the writes by
// `projectionLagMs`, and can process only `projectorRps` events a second, so a burst of writes
// builds a backlog; `ryowPct` of reads (a user reading their own change) go to the write side.
// Runs in Node (node sim.mjs --readsPerSec=1000) and in the browser.

export const PARAMS = {
  readsPerSec: { label: "Reads", unit: "per s", min: 50, max: 2000, step: 50, default: 500 },
  writesPerSec: { label: "Writes", unit: "per s", min: 10, max: 1000, step: 10, default: 100 },
  cores: { label: "CPU cores", unit: "", min: 4, max: 64, step: 4, default: 16 },
  projectionLagMs: { label: "Normal read-model lag", unit: "ms", min: 50, max: 5000, step: 50, default: 500 },
  burstWritesPerSec: { label: "Write burst", unit: "per s", min: 100, max: 5000, step: 100, default: 2000 },
  burstSec: { label: "Burst length", unit: "s", min: 1, max: 60, step: 1, default: 10 },
  projectorRps: { label: "Projector speed", unit: "events/s", min: 100, max: 5000, step: 100, default: 500 },
  ryowPct: { label: "Reads sent to the write side", unit: "%", min: 0, max: 20, step: 1, default: 2 },
};

const JOIN_CPU_MS = 40;
const WRITE_CPU_MS = 10;
const LOOKUP_CPU_MS = 0.5;
const JOIN_LATENCY_MS = 800;
const LOOKUP_LATENCY_MS = 5;

const utilPct = (cpuMsPerSec, cores) => Math.round((cpuMsPerSec / (cores * 1000)) * 100);

export function run({ readsPerSec, writesPerSec, cores, projectionLagMs, burstWritesPerSec, burstSec, projectorRps, ryowPct }) {
  const one = utilPct(readsPerSec * JOIN_CPU_MS + writesPerSec * WRITE_CPU_MS, cores);
  const single = {
    readLatencyMs: Math.round(JOIN_LATENCY_MS * Math.max(1, one / 100)),
    writeSideUtilPct: one,
    readSideUtilPct: one,
    readModelLagMs: 0,
  };

  const split = {
    readLatencyMs: LOOKUP_LATENCY_MS,
    writeSideUtilPct: utilPct(writesPerSec * WRITE_CPU_MS, cores),
    readSideUtilPct: utilPct(readsPerSec * LOOKUP_CPU_MS, cores),
    readModelLagMs: projectionLagMs,
  };

  const backlog = Math.max(0, (burstWritesPerSec - projectorRps) * burstSec);
  const behind = { ...split, writeSideUtilPct: utilPct(burstWritesPerSec * WRITE_CPU_MS, cores), readModelLagMs: projectionLagMs + Math.round((backlog / projectorRps) * 1000) };

  const ryow = {
    ...split,
    writeSideUtilPct: utilPct(writesPerSec * WRITE_CPU_MS + readsPerSec * (ryowPct / 100) * JOIN_CPU_MS, cores),
  };

  return {
    frames: [
      {
        beat: "constraints",
        title: "One model for reads and writes",
        note: `A product page joins five tables at ${JOIN_CPU_MS} ms of CPU, so ${readsPerSec.toLocaleString("en-US")} reads and ${writesPerSec} writes a second put the ${cores}-core database at ${single.writeSideUtilPct}%. Reads take ${single.readLatencyMs.toLocaleString("en-US")} ms and compete with writes for locks.`,
        metrics: single,
      },
      {
        beat: "component",
        title: "CQRS: a write model and a denormalised read model",
        note: `Writes go to a normalised store (${split.writeSideUtilPct}% used). A projector copies each change into a read model shaped like the page, so a read is one lookup: ${split.readLatencyMs} ms and ${split.readSideUtilPct}% used. The read model trails by ${split.readModelLagMs} ms.`,
        metrics: split,
      },
      {
        beat: "failure",
        title: `A burst of ${burstWritesPerSec.toLocaleString("en-US")} writes a second`,
        note: `The projector handles ${projectorRps.toLocaleString("en-US")} events a second, so a ${burstSec} s burst leaves ${backlog.toLocaleString("en-US")} events waiting. The read model is now ${(behind.readModelLagMs / 1000).toLocaleString("en-US")} s behind: a customer who just changed something reads the old value.`,
        metrics: behind,
      },
      {
        beat: "tradeoff",
        title: `Read your own writes from the write side (${ryowPct}% of reads)`,
        note: `Sending the author's own reads to the write model hides the lag for them, and puts ${ryow.writeSideUtilPct}% load on the write side instead of ${split.writeSideUtilPct}%. Everyone else still sees data up to ${ryow.readModelLagMs} ms old. You also run two models and a projector that must be monitored and rebuilt.`,
        metrics: ryow,
      },
    ],
    summary: { singleLatencyMs: single.readLatencyMs, splitLatencyMs: split.readLatencyMs },
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
