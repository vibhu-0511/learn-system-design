// p07 sim: one node accepts writes; what happens when it fails, or is cut off by a partition.
// Assumptions: writes arrive at `writesPerSec`; a person notices and promotes a new leader after
// `humanFixMin`; a follower that hears no heartbeat for `electionTimeoutMs` starts an election
// and one round of votes takes 50 ms; a network partition of `partitionSec` cuts the old leader
// off together with `minoritySharePct` of the clients; the naive election needs no majority, so
// the majority side elects a new leader while the old one keeps accepting writes; a quorum
// election needs floor(nodes / 2) + 1 votes, and a leader that loses its quorum steps down.
// Runs in Node (node sim.mjs --nodes=3) and in the browser.

export const PARAMS = {
  writesPerSec: { label: "Writes", unit: "per s", min: 10, max: 10000, step: 10, default: 1000 },
  nodes: { label: "Nodes in the group", unit: "", min: 3, max: 9, step: 1, default: 5 },
  electionTimeoutMs: { label: "Election timeout", unit: "ms", min: 50, max: 5000, step: 50, default: 300 },
  partitionSec: { label: "Partition length", unit: "s", min: 1, max: 60, step: 1, default: 10 },
  minoritySharePct: { label: "Clients stuck with the old leader", unit: "%", min: 5, max: 50, step: 5, default: 30 },
  humanFixMin: { label: "Time for a person to promote a node", unit: "min", min: 1, max: 60, step: 1, default: 15 },
};

const VOTE_ROUND_MS = 50;

function outcome({ downSec, rejectedShare, writesPerSec, doubleLeaderSec, conflictShare }) {
  return {
    failoverSec: Math.round(downSec * 100) / 100,
    writesRejected: Math.round(writesPerSec * rejectedShare * downSec),
    doubleLeaderSec,
    conflictingWrites: Math.round(writesPerSec * conflictShare * doubleLeaderSec),
  };
}

export function run({ writesPerSec, nodes, electionTimeoutMs, partitionSec, minoritySharePct, humanFixMin }) {
  const minority = minoritySharePct / 100;
  const electionSec = (electionTimeoutMs + VOTE_ROUND_MS) / 1000;
  const quorum = Math.floor(nodes / 2) + 1;

  const fixed = outcome({ downSec: humanFixMin * 60, rejectedShare: 1, writesPerSec, doubleLeaderSec: 0, conflictShare: 0 });
  const elected = outcome({ downSec: electionSec, rejectedShare: 1, writesPerSec, doubleLeaderSec: 0, conflictShare: 0 });
  const splitBrain = outcome({ downSec: electionSec, rejectedShare: 1, writesPerSec, doubleLeaderSec: partitionSec, conflictShare: minority });
  const withQuorum = outcome({ downSec: electionSec, rejectedShare: 1, writesPerSec, doubleLeaderSec: 0, conflictShare: 0 });
  withQuorum.writesRejected += Math.round(writesPerSec * minority * partitionSec);

  return {
    frames: [
      {
        beat: "constraints",
        title: "A fixed leader with a manual fix",
        note: `The leader dies and nothing promotes a replacement: writes fail for ${humanFixMin} minutes until a person acts, ${fixed.writesRejected.toLocaleString("en-US")} rejected writes at ${writesPerSec.toLocaleString("en-US")} a second.`,
        metrics: fixed,
      },
      {
        beat: "component",
        title: "Followers elect a new leader",
        note: `Followers wait ${electionTimeoutMs} ms without a heartbeat, then vote (one round takes ${VOTE_ROUND_MS} ms). A new leader is ready in ${elected.failoverSec} s and ${elected.writesRejected.toLocaleString("en-US")} writes are rejected in the gap.`,
        metrics: elected,
      },
      {
        beat: "failure",
        title: "A partition with no majority rule: split brain",
        note: `A ${partitionSec} s partition cuts the old leader off with ${minoritySharePct}% of clients. The other side elects a leader, but the old one keeps accepting writes: two leaders for ${splitBrain.doubleLeaderSec} s and ${splitBrain.conflictingWrites.toLocaleString("en-US")} conflicting writes.`,
        metrics: splitBrain,
      },
      {
        beat: "tradeoff",
        title: `Majority quorum: ${quorum} of ${nodes} votes`,
        note: `A leader needs ${quorum} of ${nodes} nodes, so the cut-off side steps down and conflicts drop to ${withQuorum.conflictingWrites}. The price is availability: its ${minoritySharePct}% of clients get errors for ${partitionSec} s, ${withQuorum.writesRejected.toLocaleString("en-US")} writes rejected in all, and the group cannot elect at all if more than ${nodes - quorum} nodes are lost.`,
        metrics: withQuorum,
      },
    ],
    summary: { failoverSec: elected.failoverSec, conflicts: splitBrain.conflictingWrites },
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
