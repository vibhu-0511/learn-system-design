// c03 sim: capacity and bottleneck run for a multi-channel notification pipeline
// (API -> priority queue -> channel workers -> providers).
// Assumptions from the vault notes: 10 billion notifications a day, split 70% push, 10% SMS,
// 20% email, and a target of under 60 seconds for high-priority messages. Assumed here and not in
// the vault: peak is 2x the average and lasts 1 hour, one worker delivers 500 messages a second,
// workers are sized to 70% load at the rate they must carry, a worker costs $150 a month, OTP and
// security messages are 5% of traffic, a healthy message spends about 1 second in the pipeline,
// and a marketing campaign is enqueued all at once at peak time.
// Runs in Node (node sim.mjs --campaignM=100) and in the browser.

export const PARAMS = {
  perDayB: { label: "Notifications per day", unit: "B", min: 1, max: 50, step: 1, default: 10 },
  peakFactor: { label: "Peak over average", unit: "x", min: 1, max: 5, step: 1, default: 2 },
  campaignM: { label: "Marketing campaign sent at once", unit: "M", min: 1, max: 500, step: 1, default: 50 },
  reservedPct: { label: "Workers reserved for high priority", unit: "%", min: 1, max: 50, step: 1, default: 10 },
};

const SMS_SHARE = 0.1;
const HIGH_SHARE = 0.05;
const WORKER_RPS = 500;
const TARGET_LOAD = 0.7;
const WORKER_USD = 150;
const PEAK_SECONDS = 3600;
const BASE_SEC = 1;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ peakRps, workers, backlog, otpDelaySec, campaignDrainSec = 0, idleReservedPct = 0 }) {
  return {
    peakRps: Math.round(peakRps),
    smsRps: Math.round(peakRps * SMS_SHARE),
    workers,
    backlogM: round1(backlog / 1e6),
    otpDelaySec: Math.round(otpDelaySec),
    campaignDrainSec: Math.round(campaignDrainSec),
    idleReservedPct: Math.round(idleReservedPct),
    monthlyCostUsd: workers * WORKER_USD,
  };
}

const workersFor = (rps) => Math.ceil(rps / (WORKER_RPS * TARGET_LOAD));

export function run({ perDayB, peakFactor, campaignM, reservedPct }) {
  const avgRps = (perDayB * 1e9) / 86400;
  const peakRps = avgRps * peakFactor;

  const avgWorkers = workersFor(avgRps);
  const avgCapacity = avgWorkers * WORKER_RPS;
  const behind = Math.max(0, peakRps - avgCapacity) * PEAK_SECONDS;
  const undersized = outcome({ peakRps, workers: avgWorkers, backlog: behind, otpDelaySec: BASE_SEC + behind / avgCapacity });

  const workers = workersFor(peakRps);
  const capacity = workers * WORKER_RPS;
  const sized = outcome({ peakRps, workers, backlog: 0, otpDelaySec: BASE_SEC });

  const campaign = campaignM * 1e6;
  const spare = Math.max(1, capacity - peakRps);
  const shared = outcome({ peakRps, workers, backlog: campaign, otpDelaySec: BASE_SEC + campaign / spare, campaignDrainSec: campaign / spare });

  const reservedWorkers = Math.max(1, Math.ceil((workers * reservedPct) / 100));
  const reservedCap = reservedWorkers * WORKER_RPS;
  const highRps = peakRps * HIGH_SHARE;
  const highBehind = Math.max(0, highRps - reservedCap) * PEAK_SECONDS;
  const lowSpare = Math.max(1, capacity - reservedCap - (peakRps - highRps));
  const lanes = outcome({
    peakRps,
    workers,
    backlog: campaign + highBehind,
    otpDelaySec: BASE_SEC + highBehind / reservedCap,
    campaignDrainSec: campaign / lowSpare,
    idleReservedPct: Math.max(0, (1 - highRps / reservedCap) * 100),
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: `${perDayB}B notifications a day, sized for the average`,
        note: `That is ${Math.round(avgRps).toLocaleString("en-US")} a second on average and ${undersized.peakRps.toLocaleString("en-US")} at a ${peakFactor}x peak, ${undersized.smsRps.toLocaleString("en-US")} of them SMS. ${undersized.workers} workers cover the average but not the peak hour: ${undersized.backlogM}M messages pile up and a one-time code waits ${undersized.otpDelaySec} seconds against a 60-second target.`,
        metrics: undersized,
      },
      {
        beat: "component",
        title: "v1: queue per channel, workers sized for the peak",
        note: `The API validates and enqueues, and per-channel workers deliver. Sized to ${TARGET_LOAD * 100}% load at the peak, ${sized.workers} workers keep the backlog at ${sized.backlogM}M and a code takes about ${sized.otpDelaySec} second. The fleet costs $${sized.monthlyCostUsd.toLocaleString("en-US")} a month.`,
        metrics: sized,
      },
      {
        beat: "failure",
        title: `A ${campaignM}M-message marketing campaign hits the same queue`,
        note: `The fleet has only ${Math.round(spare).toLocaleString("en-US")} a second spare at peak, so the campaign takes ${shared.campaignDrainSec} seconds to drain, and every one-time code queued behind it waits that long: ${shared.otpDelaySec} seconds against a 60-second target.`,
        metrics: shared,
      },
      {
        beat: "tradeoff",
        title: "Priority lanes with reserved workers",
        note: `${reservedWorkers} workers are reserved for the ${HIGH_SHARE * 100}% of traffic that is high priority, so a code waits about ${lanes.otpDelaySec} second whatever the campaign does. The campaign now needs ${lanes.campaignDrainSec} seconds, and ${lanes.idleReservedPct}% of the reserved capacity sits idle in normal traffic.`,
        metrics: lanes,
      },
    ],
    summary: { avgWorkers, workers, campaignDrainSec: shared.campaignDrainSec, laneDrainSec: lanes.campaignDrainSec },
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
