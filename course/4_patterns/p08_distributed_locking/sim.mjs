// p08 sim: two workers share a resource, and one of them pauses (a garbage collection) while
// holding the lock.
// Assumptions: the lock is a lease that expires `ttlSec` after the last renewal, and the holder
// renews every ttlSec / 3; a job runs `jobSec`; the holder writes `writesPerSec` while it runs;
// after a pause longer than the lease, another worker takes the lock, and the paused worker
// wakes up still believing it holds it and keeps writing until its next renewal fails, about
// ttlSec / 3 later; a fencing token is a number that grows with each lock grant, and the storage
// rejects any write with a token lower than the highest it has seen.
// Runs in Node (node sim.mjs --pauseSec=30) and in the browser.

export const PARAMS = {
  writesPerSec: { label: "Writes by the holder", unit: "per s", min: 10, max: 1000, step: 10, default: 100 },
  jobSec: { label: "Job length", unit: "s", min: 10, max: 300, step: 10, default: 60 },
  ttlSec: { label: "Lock lease", unit: "s", min: 3, max: 60, step: 1, default: 10 },
  pauseSec: { label: "Pause of the holder", unit: "s", min: 0, max: 60, step: 1, default: 15 },
};

const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ overlapSec, accepted, failoverSec, ttlSec }) {
  return {
    doubleWriterSec: round1(overlapSec),
    staleWritesAccepted: Math.round(accepted),
    failoverSec,
    renewalsPerMin: round1(60 / (ttlSec / 3)),
  };
}

export function run({ writesPerSec, jobSec, ttlSec, pauseSec }) {
  const renewSec = ttlSec / 3;
  const expired = pauseSec > ttlSec;
  const staleSec = expired ? renewSec : 0;

  const none = { doubleWriterSec: jobSec, staleWritesAccepted: writesPerSec * jobSec, failoverSec: 0, renewalsPerMin: 0 };
  const lease = outcome({ overlapSec: 0, accepted: 0, failoverSec: ttlSec, ttlSec });
  const paused = outcome({ overlapSec: staleSec, accepted: writesPerSec * staleSec, failoverSec: ttlSec, ttlSec });
  const fenced = outcome({ overlapSec: staleSec, accepted: 0, failoverSec: ttlSec, ttlSec });

  const shortTtl = Math.max(1, Math.round(ttlSec / 2));
  return {
    frames: [
      {
        beat: "constraints",
        title: "No lock: two workers, one resource",
        note: `Both workers run the same ${jobSec} s job and write at once: ${none.staleWritesAccepted.toLocaleString("en-US")} writes from the second one collide with the first.`,
        metrics: none,
      },
      {
        beat: "component",
        title: `A lease lock: ${ttlSec} s, renewed every ${round1(renewSec)} s`,
        note: `Only the holder writes. If it dies, the lease runs out and another worker takes over after at most ${lease.failoverSec} s. Renewing costs ${lease.renewalsPerMin} calls a minute.`,
        metrics: lease,
      },
      {
        beat: "failure",
        title: `The holder pauses for ${pauseSec} s`,
        note: expired
          ? `The pause outlasts the ${ttlSec} s lease, so another worker takes the lock. The first wakes up still believing it holds it and writes for about ${paused.doubleWriterSec} s more: ${paused.staleWritesAccepted.toLocaleString("en-US")} writes from a stale holder are accepted.`
          : `The ${pauseSec} s pause is shorter than the ${ttlSec} s lease, so the lock is still valid when the holder wakes. No harm here; raise the pause above ${ttlSec} s to see the failure.`,
        metrics: paused,
      },
      {
        beat: "tradeoff",
        title: "Fencing tokens on every write",
        note: `Each lock grant carries a rising token and the storage rejects an older one, so ${fenced.staleWritesAccepted} stale writes get through even though the old holder still writes for ${fenced.doubleWriterSec} s. It needs a storage layer that checks tokens. Halving the lease to ${shortTtl} s speeds failover but doubles the renewals to ${round1(60 / (shortTtl / 3))} a minute.`,
        metrics: fenced,
      },
    ],
    summary: { staleAccepted: paused.staleWritesAccepted, fencedAccepted: fenced.staleWritesAccepted },
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
