// p02 sim: one database copy, then replicas kept in step asynchronously, then synchronously.
// Assumptions: a write takes 2 ms on the primary; a replica is `replicaRttMs` away and needs
// 10 ms to apply a change, so its normal lag is round trip plus apply; one node serves 5,000
// reads a second; the single node's last backup is `backupHours` old; under load the lag can
// spike to `spikeLagMs` (the vault note calls 5,000 ms unacceptable); a failover promotes a
// replica, and every write it had not yet received is lost; synchronous replication waits for
// every replica to confirm before it answers.
// Runs in Node (node sim.mjs --replicaRttMs=80) and in the browser.

export const PARAMS = {
  writesPerSec: { label: "Writes", unit: "per s", min: 10, max: 10000, step: 10, default: 1000 },
  replicas: { label: "Replicas", unit: "", min: 1, max: 5, step: 1, default: 2 },
  replicaRttMs: { label: "Round trip to a replica", unit: "ms", min: 1, max: 200, step: 1, default: 20 },
  spikeLagMs: { label: "Lag during a load spike", unit: "ms", min: 100, max: 20000, step: 100, default: 5000 },
  backupHours: { label: "Age of the last backup", unit: "h", min: 1, max: 48, step: 1, default: 12 },
};

const WRITE_MS = 2;
const APPLY_MS = 10;
const READS_PER_NODE_RPS = 5000;

function outcome({ writeMs, writesLost, nodes, lagMs }) {
  return {
    writeLatencyMs: Math.round(writeMs),
    writesLost: Math.round(writesLost),
    readCapacityRps: nodes * READS_PER_NODE_RPS,
    replicaLagMs: Math.round(lagMs),
  };
}

export function run({ writesPerSec, replicas, replicaRttMs, spikeLagMs, backupHours }) {
  const lagMs = replicaRttMs + APPLY_MS;

  const single = outcome({ writeMs: WRITE_MS, writesLost: writesPerSec * backupHours * 3600, nodes: 1, lagMs: 0 });
  const asyncRep = outcome({ writeMs: WRITE_MS, writesLost: (writesPerSec * lagMs) / 1000, nodes: 1 + replicas, lagMs });
  const spiked = outcome({ writeMs: WRITE_MS, writesLost: (writesPerSec * spikeLagMs) / 1000, nodes: 1 + replicas, lagMs: spikeLagMs });
  const sync = outcome({ writeMs: WRITE_MS + replicaRttMs + APPLY_MS, writesLost: 0, nodes: 1 + replicas, lagMs: 0 });

  return {
    frames: [
      {
        beat: "constraints",
        title: "One database, one copy",
        note: `The server dies and the last backup is ${backupHours} hours old: ${single.writesLost.toLocaleString("en-US")} writes at ${writesPerSec.toLocaleString("en-US")} a second are gone. Reads and writes also share one machine's ${single.readCapacityRps.toLocaleString("en-US")} reads a second.`,
        metrics: single,
      },
      {
        beat: "component",
        title: `Async replication to ${replicas} replicas`,
        note: `The primary answers in ${asyncRep.writeLatencyMs} ms and ships changes in the background. Replicas trail by ${asyncRep.replicaLagMs} ms, a crash loses about ${asyncRep.writesLost.toLocaleString("en-US")} writes, and reads scale to ${asyncRep.readCapacityRps.toLocaleString("en-US")} a second.`,
        metrics: asyncRep,
      },
      {
        beat: "failure",
        title: `Lag spikes to ${spikeLagMs.toLocaleString("en-US")} ms, then the primary fails`,
        note: `Replicas are ${spiked.replicaLagMs.toLocaleString("en-US")} ms behind, so users reading a replica miss their own writes, and promoting one on failover loses ${spiked.writesLost.toLocaleString("en-US")} acknowledged writes.`,
        metrics: spiked,
      },
      {
        beat: "tradeoff",
        title: "Synchronous replication",
        note: `Waiting for every replica loses no writes and leaves no lag, but each write now takes ${sync.writeLatencyMs} ms instead of ${asyncRep.writeLatencyMs} ms, and one slow or dead replica stalls all writes. Semi-sync waits for just one replica as a middle path.`,
        metrics: sync,
      },
    ],
    summary: { asyncLost: asyncRep.writesLost, syncWriteMs: sync.writeLatencyMs },
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
