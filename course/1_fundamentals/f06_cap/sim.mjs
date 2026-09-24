// f06 sim: what a system does while its network is split (CAP).
// Scenario: three replicas lose contact; the two on one side keep a majority, and a
// minority of clients can only reach the third. A partition is not optional in a
// distributed system, so the real choice is what to give up while it lasts.
// Assumptions: a fixed share of clients sits on the small side, and a fixed share of
// the data is changed on the big side while the split lasts.
// Runs in Node (node sim.mjs --minorityPct=20) and in the browser.

export const PARAMS = {
  requestsPerSec: { label: "Traffic", unit: "req/s", min: 10, max: 1000, step: 10, default: 200 },
  partitionSec: { label: "Split lasts", unit: "s", min: 10, max: 300, step: 10, default: 60 },
  minorityPct: { label: "Clients cut off on the small side", unit: "%", min: 10, max: 49, step: 1, default: 33 },
  changedKeysPct: { label: "Data changed on the big side meanwhile", unit: "%", min: 5, max: 100, step: 5, default: 30 },
  criticalPct: { label: "Traffic that must be correct", unit: "%", min: 0, max: 100, step: 5, default: 20 },
};

const round1 = (n) => Math.round(n * 10) / 10;

const outcome = (availability, rejected, stale) => ({
  availabilityPct: round1(availability * 100),
  rejectedRequests: Math.round(rejected),
  staleReadsPct: round1(stale * 100),
});

export function run({ requestsPerSec, partitionSec, minorityPct, changedKeysPct, criticalPct }) {
  const total = requestsPerSec * partitionSec;
  const minority = minorityPct / 100;
  const changed = changedKeysPct / 100;
  const critical = criticalPct / 100;

  const healthy = outcome(1, 0, 0);
  const cp = outcome(1 - minority, total * minority, 0);
  const ap = outcome(1, 0, minority * changed);
  const mixed = outcome(1 - minority * critical, total * minority * critical, minority * (1 - critical) * changed);

  return {
    frames: [
      {
        beat: "constraints",
        title: "Healthy: three replicas agree",
        note: `Every request is answered with the latest data. That is the easy case, and it never lasts.`,
        metrics: healthy,
      },
      {
        beat: "component",
        title: "CP: refuse what you cannot verify",
        note: `The small side cannot reach a majority, so it refuses requests instead of guessing. Answers are always correct, but ${minorityPct}% of clients get errors: ${cp.rejectedRequests} rejected requests over ${partitionSec} s.`,
        metrics: cp,
      },
      {
        beat: "failure",
        title: "AP: keep serving both sides",
        note: `Nobody gets an error, but the small side answers from data that missed the big side's writes. About ${ap.staleReadsPct}% of reads are stale, and the two sides must reconcile after the split heals.`,
        metrics: ap,
      },
      {
        beat: "tradeoff",
        title: "Choose per feature",
        note: `Treat ${criticalPct}% of traffic (payments, inventory) as CP and the rest (feeds, likes) as AP: ${mixed.availabilityPct}% availability and ${mixed.staleReadsPct}% stale reads, instead of giving up one side entirely.`,
        metrics: mixed,
      },
    ],
    summary: { cpAvailabilityPct: cp.availabilityPct, apStaleReadsPct: ap.staleReadsPct },
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
