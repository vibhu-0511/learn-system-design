// p19 sim: a checkout that spans `steps` services, each with its own database, failing at step k.
// Assumptions: no single transaction covers the services; a step (or a compensation) takes
// `stepMs`; in an orchestrated saga a coordinator sends a command and gets a reply for every
// step, so one step costs 2 messages; in a choreographed saga each service publishes one event and
// the next reacts, so one step costs 1 message; a failing step at `failAtStep` triggers
// compensations for every earlier step, in reverse; a compensation fails with probability
// `compFailPct` and is retried `retries` times (retries are safe because compensations are
// idempotent); `failPct` of `sagasPerDay` fail at that step; a person fixes a leftover
// inconsistency after `manualFixMin`.
// Runs in Node (node sim.mjs --failAtStep=5) and in the browser.

export const PARAMS = {
  steps: { label: "Steps in the checkout", unit: "", min: 2, max: 10, step: 1, default: 5 },
  failAtStep: { label: "Step that fails", unit: "", min: 2, max: 10, step: 1, default: 4 },
  stepMs: { label: "One step", unit: "ms", min: 20, max: 2000, step: 20, default: 200 },
  sagasPerDay: { label: "Checkouts a day", unit: "", min: 1000, max: 1000000, step: 1000, default: 100000 },
  failPct: { label: "Checkouts that fail at that step", unit: "%", min: 0.1, max: 20, step: 0.1, default: 2 },
  compFailPct: { label: "Compensations that fail", unit: "%", min: 0, max: 30, step: 1, default: 5 },
  retries: { label: "Retries of a compensation", unit: "", min: 0, max: 5, step: 1, default: 3 },
  manualFixMin: { label: "Time for a person to repair", unit: "min", min: 1, max: 240, step: 1, default: 30 },
};

const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ left, messages, windowSec, stuck }) {
  return {
    leftBehindSteps: left,
    messages,
    inconsistentSec: round1(windowSec),
    stuckSagasPerDay: Math.round(stuck),
  };
}

export function run({ steps, failAtStep, stepMs, sagasPerDay, failPct, compFailPct, retries, manualFixMin }) {
  const k = Math.min(failAtStep, steps);
  const done = k - 1;
  const failing = sagasPerDay * (failPct / 100);
  const c = compFailPct / 100;
  const stuckWith = (attempts) => failing * (1 - (1 - c ** attempts) ** done);

  const noSaga = outcome({ left: done, messages: 2 * k, windowSec: manualFixMin * 60, stuck: failing });
  const orchestratedMessages = 2 * k + 2 * done;
  const windowSec = ((k + done) * stepMs) / 1000;
  const saga = outcome({ left: 0, messages: orchestratedMessages, windowSec, stuck: 0 });
  const fragile = outcome({ left: done, messages: orchestratedMessages, windowSec, stuck: stuckWith(1) });
  const retried = outcome({ left: 0, messages: orchestratedMessages, windowSec, stuck: stuckWith(retries + 1) });
  const choreographyMessages = k + 1 + done;

  return {
    frames: [
      {
        beat: "constraints",
        title: `Checkout fails at step ${k} of ${steps}, with no saga`,
        note: `Each service commits on its own. Steps 1 to ${done} are already committed when step ${k} fails: money taken, stock reserved, no order. ${failing.toLocaleString("en-US")} checkouts a day are left like that until a person repairs them (${manualFixMin} min each).`,
        metrics: noSaga,
      },
      {
        beat: "component",
        title: "An orchestrated saga with compensations",
        note: `A coordinator runs the steps and, when step ${k} fails, undoes steps ${done} to 1 in reverse (refund, release stock). Nothing is left behind after ${saga.inconsistentSec} s and ${saga.messages} messages.`,
        metrics: saga,
      },
      {
        beat: "failure",
        title: `${compFailPct}% of compensations fail`,
        note: `An undo is a call to a service too, and it can fail. With ${compFailPct}% failing and no retry, about ${fragile.stuckSagasPerDay.toLocaleString("en-US")} sagas a day are stuck half-done. Until they finish, other users can see the in-between state (a saga is not isolated).`,
        metrics: fragile,
      },
      {
        beat: "tradeoff",
        title: `Idempotent compensations retried ${retries} times`,
        note: `Retrying each compensation (safe because it is idempotent, p11) cuts stuck sagas to ${retried.stuckSagasPerDay}. A choreographed saga would use ${choreographyMessages} messages instead of ${retried.messages}, but no one service knows how far a saga has got, and each service must know the others' events.`,
        metrics: retried,
      },
    ],
    summary: { orchestratedMessages, choreographyMessages },
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
