// b03 sim: partitioning writes across NoSQL nodes, and the hot key that breaks it.
// Assumptions: a partition key is hashed, so uniform keys spread load evenly; one hot key
// receives a fixed share of all writes and lives on one node; salting a hot key across K
// sub-keys spreads its writes over K nodes but a read must then ask all K.
// Runs in Node (node sim.mjs --hotSharePct=40) and in the browser.

export const PARAMS = {
  writeRps: { label: "Writes", unit: "req/s", min: 5000, max: 200000, step: 5000, default: 60000 },
  nodeRps: { label: "One node's capacity", unit: "req/s", min: 5000, max: 50000, step: 1000, default: 20000 },
  nodes: { label: "Nodes", unit: "", min: 3, max: 24, step: 1, default: 6 },
  hotSharePct: { label: "Writes that hit one key", unit: "%", min: 0, max: 60, step: 5, default: 25 },
  saltBuckets: { label: "Sub-keys when salting", unit: "", min: 2, max: 16, step: 1, default: 4 },
};

const round1 = (n) => Math.round(n * 10) / 10;

const outcome = (busiestLoad, nodeRps, nodes, readFanout) => ({
  busiestNodePct: round1((busiestLoad / nodeRps) * 100),
  nodes,
  readQueriesPerRead: readFanout,
  headroomPct: round1(Math.max(0, (1 - busiestLoad / nodeRps) * 100)),
});

export function run({ writeRps, nodeRps, nodes, hotSharePct, saltBuckets }) {
  const hot = (hotSharePct / 100) * writeRps;
  const rest = writeRps - hot;

  const single = outcome(writeRps, nodeRps, 1, 1);
  const uniform = outcome(writeRps / nodes, nodeRps, nodes, 1);
  // The hot key's node carries the whole hot share plus its ordinary slice of the rest.
  const skewed = outcome(hot + rest / nodes, nodeRps, nodes, 1);
  const salted = outcome(hot / saltBuckets + rest / nodes, nodeRps, nodes, saltBuckets);

  return {
    frames: [
      {
        beat: "constraints",
        title: "One node takes every write",
        note: `${writeRps} writes a second against a node that handles ${nodeRps}: it runs at ${single.busiestNodePct}%.`,
        metrics: single,
      },
      {
        beat: "component",
        title: `Partition by key across ${nodes} nodes`,
        note: `Hashing the key spreads writes evenly: ${round1(writeRps / nodes)} a second each, ${uniform.busiestNodePct}% utilization. No joins, no fixed schema, and capacity grows by adding nodes.`,
        metrics: uniform,
      },
      {
        beat: "failure",
        title: "One hot key",
        note: `${hotSharePct}% of writes hit a single key, so its node takes ${round1(hot + rest / nodes)} a second and runs at ${skewed.busiestNodePct}% while the others sit mostly idle. Adding nodes does not help.`,
        metrics: skewed,
      },
      {
        beat: "tradeoff",
        title: `Salt the hot key across ${saltBuckets} sub-keys`,
        note: `The hot key now spreads over ${saltBuckets} nodes, so the busiest runs at ${salted.busiestNodePct}%. The price: reading that key must query all ${saltBuckets} sub-keys and merge the results.`,
        metrics: salted,
      },
    ],
    summary: { uniformPct: uniform.busiestNodePct, skewedPct: skewed.busiestNodePct },
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
