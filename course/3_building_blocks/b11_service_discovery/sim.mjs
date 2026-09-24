// b11 sim: how callers find the instances of one service, and what they do when it goes wrong.
// Assumptions: callers send `rps` requests a second spread evenly over `instances` copies of
// a service; a request to a dead instance fails; with hard-coded addresses a person notices
// and fixes it after `humanFixMin`; with a registry, an instance is dropped after it misses
// `missedBeats` heartbeats sent every `heartbeatSec` seconds; during a registry outage of
// `outageMin` minutes a fraction `churnPctPerHour` of instances are replaced each hour.
// A CP registry refuses lookups it cannot confirm, so callers that need one fail; an AP registry
// keeps answering from the last list it knew, and callers keep a copy.
// Runs in Node (node sim.mjs --heartbeatSec=30) and in the browser.

export const PARAMS = {
  instances: { label: "Instances of the service", unit: "", min: 2, max: 100, step: 1, default: 10 },
  rps: { label: "Requests to it", unit: "req/s", min: 10, max: 10000, step: 10, default: 1000 },
  humanFixMin: { label: "Time for a person to fix a hard-coded list", unit: "min", min: 5, max: 240, step: 5, default: 45 },
  heartbeatSec: { label: "Heartbeat interval", unit: "s", min: 1, max: 60, step: 1, default: 10 },
  missedBeats: { label: "Missed beats before removal", unit: "", min: 1, max: 10, step: 1, default: 3 },
  outageMin: { label: "Registry outage", unit: "min", min: 1, max: 60, step: 1, default: 10 },
  churnPctPerHour: { label: "Instances replaced per hour", unit: "%", min: 0, max: 100, step: 5, default: 10 },
};

const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ staleWindowSec, share, rps }) {
  return {
    staleWindowSec: Math.round(staleWindowSec),
    failedRequests: Math.round(rps * share * staleWindowSec),
    callsFailingPct: round1(share * 100),
  };
}

export function run({ instances, rps, humanFixMin, heartbeatSec, missedBeats, outageMin, churnPctPerHour }) {
  const oneInstance = 1 / instances;
  const hardCoded = outcome({ staleWindowSec: humanFixMin * 60, share: oneInstance, rps });

  const detectSec = heartbeatSec * missedBeats;
  const registry = outcome({ staleWindowSec: detectSec, share: oneInstance, rps });

  const cp = outcome({ staleWindowSec: outageMin * 60, share: 1, rps });

  const staleShare = Math.min(1, (churnPctPerHour / 100) * (outageMin / 60));
  const ap = outcome({ staleWindowSec: outageMin * 60, share: staleShare, rps });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Hard-coded addresses",
        note: `One of ${instances} instances dies at 3 AM. Every caller keeps sending it ${round1(oneInstance * 100)}% of traffic until a person edits the config, ${humanFixMin} minutes later: ${hardCoded.failedRequests.toLocaleString("en-US")} failed requests.`,
        metrics: hardCoded,
      },
      {
        beat: "component",
        title: "A registry with heartbeats",
        note: `Instances register and send a heartbeat every ${heartbeatSec} s. After ${missedBeats} missed beats (${detectSec} s) the registry drops the dead one, so ${registry.failedRequests.toLocaleString("en-US")} requests fail instead of ${hardCoded.failedRequests.toLocaleString("en-US")}.`,
        metrics: registry,
      },
      {
        beat: "failure",
        title: "A CP registry goes down",
        note: `If the registry favours consistency, it refuses lookups it cannot confirm during a ${outageMin} minute outage. Callers that need a lookup fail: ${cp.callsFailingPct}% of calls, ${cp.failedRequests.toLocaleString("en-US")} requests.`,
        metrics: cp,
      },
      {
        beat: "tradeoff",
        title: "An AP registry answers with stale data",
        note: `An AP registry keeps serving its last list. About ${ap.callsFailingPct}% of entries are stale after ${outageMin} minutes, and each costs one failed request plus a retry: ${ap.failedRequests.toLocaleString("en-US")} requests fail. Stale data beats no data here, but a database leader must not be stale, which is why Kafka uses a CP store.`,
        metrics: ap,
      },
    ],
    summary: { hardCodedFailed: hardCoded.failedRequests, registryFailed: registry.failedRequests },
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
