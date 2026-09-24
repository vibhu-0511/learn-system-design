// e02 sim: scaling a database, from one node to read replicas to shards.
// Assumptions: every node handles the same number of queries a second; reads spread
// evenly over replicas; writes always go to one primary; a replica lags the primary by
// 20 ms plus more as the primary gets busier, and without bound once it is overloaded;
// a share of reads are cross-shard queries that must ask every shard.
// Runs in Node (node sim.mjs --shards=8) and in the browser.

export const PARAMS = {
  readRps: { label: "Reads", unit: "req/s", min: 2000, max: 60000, step: 1000, default: 12000 },
  writeRps: { label: "Writes", unit: "req/s", min: 200, max: 20000, step: 200, default: 2000 },
  nodeRps: { label: "One database node", unit: "req/s", min: 2000, max: 10000, step: 500, default: 5000 },
  replicas: { label: "Read replicas", unit: "", min: 1, max: 8, step: 1, default: 3 },
  shards: { label: "Shards", unit: "", min: 2, max: 16, step: 1, default: 6 },
  crossShardPct: { label: "Reads that touch every shard", unit: "%", min: 0, max: 50, step: 5, default: 10 },
};

const WRITE_GROWTH = 4;
const LAG_BASE_MS = 20;
const LAG_CAP_MS = 5000;
const round1 = (n) => Math.round(n * 10) / 10;

const lagFor = (primaryUtil) => (primaryUtil >= 1 ? LAG_CAP_MS : round1(LAG_BASE_MS + 100 * primaryUtil));

function outcome({ busiest, nodes, lagMs, extraPct }) {
  return { busiestNodePct: round1(busiest * 100), nodes, replicationLagMs: lagMs, extraQueryPct: round1(extraPct) };
}

export function run({ readRps, writeRps, nodeRps, replicas, shards, crossShardPct }) {
  const single = outcome({ busiest: (readRps + writeRps) / nodeRps, nodes: 1, lagMs: 0, extraPct: 0 });

  const primary = writeRps / nodeRps;
  const replica = readRps / (replicas * nodeRps);
  const withReplicas = outcome({ busiest: Math.max(primary, replica), nodes: 1 + replicas, lagMs: lagFor(primary), extraPct: 0 });

  const grownWrites = writeRps * WRITE_GROWTH;
  const grownPrimary = grownWrites / nodeRps;
  const writeHeavy = outcome({ busiest: Math.max(grownPrimary, replica), nodes: 1 + replicas, lagMs: lagFor(grownPrimary), extraPct: 0 });

  // A cross-shard read asks every shard, so it costs `shards` queries instead of one.
  const fanOut = (crossShardPct / 100) * (shards - 1);
  const shardLoad = (grownWrites + readRps * (1 + fanOut)) / shards;
  const sharded = outcome({ busiest: shardLoad / nodeRps, nodes: shards, lagMs: 0, extraPct: fanOut * 100 });

  return {
    frames: [
      {
        beat: "constraints",
        title: "One database for everything",
        note: `${readRps} reads and ${writeRps} writes a second against a node that handles ${nodeRps}: it runs at ${single.busiestNodePct}%.`,
        metrics: single,
      },
      {
        beat: "component",
        title: `${replicas} read replicas`,
        note: `Reads spread over the replicas (${round1(replica * 100)}% each) and the primary keeps only the writes (${round1(primary * 100)}%). Replicas lag by ${withReplicas.replicationLagMs} ms.`,
        metrics: withReplicas,
      },
      {
        beat: "failure",
        title: `Writes grow ${WRITE_GROWTH}x`,
        note: `Replicas cannot absorb writes: the primary now takes ${round1(grownPrimary * 100)}% and replication lag reaches ${writeHeavy.replicationLagMs} ms. Adding more replicas does not help.`,
        metrics: writeHeavy,
      },
      {
        beat: "tradeoff",
        title: `Shard across ${shards} nodes`,
        note: `Writes now split ${shards} ways, so the busiest node runs at ${sharded.busiestNodePct}%. The price is queries that need every shard: ${crossShardPct}% of reads fan out, adding ${sharded.extraQueryPct}% more read queries, plus harder joins and transactions.`,
        metrics: sharded,
      },
    ],
    summary: { replicaPrimaryPct: withReplicas.busiestNodePct, shardedBusiestPct: sharded.busiestNodePct },
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
