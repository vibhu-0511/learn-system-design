// b05 sim: taking slow work off the request path with a queue.
// Scenario: an upload triggers a slow job (validate, transcode, thumbnails).
// Assumptions: jobs arrive steadily, each takes `jobSec`, and `workers` process them in
// parallel; a spike multiplies the arrival rate for a while; a fixed share of jobs have a
// consumer crash before acknowledging, so at-least-once redelivers them (duplicates) and
// at-most-once would drop them (loss).
// Runs in Node (node sim.mjs --spikeMultiplier=8) and in the browser.

export const PARAMS = {
  uploadsPerSec: { label: "Uploads", unit: "per s", min: 1, max: 100, step: 1, default: 20 },
  jobSec: { label: "Time to process one job", unit: "s", min: 10, max: 120, step: 5, default: 45 },
  workers: { label: "Workers", unit: "", min: 100, max: 3000, step: 100, default: 1200 },
  spikeMultiplier: { label: "Traffic spike", unit: "x", min: 1, max: 10, step: 1, default: 5 },
  spikeSec: { label: "Spike lasts", unit: "s", min: 10, max: 600, step: 10, default: 120 },
  crashPct: { label: "Jobs whose worker crashes before ack", unit: "%", min: 0, max: 10, step: 0.5, default: 2 },
};

const QUEUE_RESPONSE_MS = 200;
const round1 = (n) => Math.round(n * 10) / 10;

const outcome = ({ responseMs, backlog = 0, waitSec = 0, duplicates = 0, lost = 0 }) => ({
  responseMs,
  backlogJobs: Math.round(backlog),
  waitSec: round1(waitSec),
  duplicateJobs: Math.round(duplicates),
  lostJobs: Math.round(lost),
});

export function run({ uploadsPerSec, jobSec, workers, spikeMultiplier, spikeSec, crashPct }) {
  const capacity = workers / jobSec; // jobs the workers finish per second
  const sync = outcome({ responseMs: jobSec * 1000 });
  const queued = outcome({ responseMs: QUEUE_RESPONSE_MS });

  const spikeRate = uploadsPerSec * spikeMultiplier;
  const backlog = Math.max(0, (spikeRate - capacity) * spikeSec);
  const spiked = outcome({ responseMs: QUEUE_RESPONSE_MS, backlog, waitSec: backlog / capacity });

  const jobsPerHour = uploadsPerSec * 3600;
  const redelivered = (crashPct / 100) * jobsPerHour;
  const guaranteed = outcome({ responseMs: QUEUE_RESPONSE_MS, duplicates: redelivered });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Do the work while the user waits",
        note: `The request validates, transcodes and makes thumbnails before it answers: ${jobSec} s of spinner. One slow step and the whole request stalls.`,
        metrics: sync,
      },
      {
        beat: "component",
        title: "Put the job on a queue",
        note: `The API enqueues and answers in ${QUEUE_RESPONSE_MS} ms. ${workers} workers finish ${round1(capacity)} jobs a second against ${uploadsPerSec} arriving, so the queue stays empty.`,
        metrics: queued,
      },
      {
        beat: "failure",
        title: `A ${spikeMultiplier}x spike for ${spikeSec} s`,
        note:
          backlog > 0
            ? `${spikeRate} jobs a second arrive but only ${round1(capacity)} finish, so ${spiked.backlogJobs} jobs pile up and the last one waits ${spiked.waitSec} s. Users still get an instant answer; the work is just late.`
            : `${spikeRate} jobs a second is still within the ${round1(capacity)} the workers finish, so nothing backs up.`,
        metrics: spiked,
      },
      {
        beat: "tradeoff",
        title: "At-least-once delivery",
        note: `If a worker crashes before acknowledging, the job is redelivered: about ${guaranteed.duplicateJobs} duplicates an hour at ${crashPct}% crashes. At-most-once would instead lose those ${guaranteed.duplicateJobs} jobs. So consumers must be idempotent (p11).`,
        metrics: guaranteed,
      },
    ],
    summary: { syncMs: sync.responseMs, backlogJobs: spiked.backlogJobs },
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
