// p18 sim: storing the current state of an account, or every event that led to it.
// Assumptions: the system has `aggregates` accounts (or orders), each with `eventsPerAggregate`
// events on average and one long-lived account with `longLivedEvents`; a state row takes
// `stateKb` and reads in 2 ms; an event takes `eventKb`; replay processes `replayEventsPerSec`
// events a second; a snapshot is written every `snapshotEvery` events per account and takes
// `snapshotKb`, and only the latest is kept, so loading replays at most `snapshotEvery` events.
// Runs in Node (node sim.mjs --longLivedEvents=1000000) and in the browser.

export const PARAMS = {
  aggregates: { label: "Accounts", unit: "", min: 1000, max: 1000000, step: 1000, default: 100000 },
  eventsPerAggregate: { label: "Events per account", unit: "", min: 10, max: 5000, step: 10, default: 200 },
  longLivedEvents: { label: "Events in the busiest account", unit: "", min: 1000, max: 2000000, step: 1000, default: 200000 },
  replayEventsPerSec: { label: "Replay speed", unit: "events/s", min: 5000, max: 500000, step: 5000, default: 50000 },
  snapshotEvery: { label: "Snapshot every", unit: "events", min: 100, max: 50000, step: 100, default: 1000 },
  eventKb: { label: "Size of one event", unit: "KB", min: 0.5, max: 10, step: 0.5, default: 1 },
  stateKb: { label: "Size of one state row", unit: "KB", min: 0.5, max: 20, step: 0.5, default: 2 },
  snapshotKb: { label: "Size of one snapshot", unit: "KB", min: 1, max: 50, step: 1, default: 5 },
};

const STATE_READ_MS = 2;
const mb = (kb) => Math.round(kb / 1024);

function outcome({ loadMs, storageKb, history, snapshots }) {
  return {
    loadStateMs: Math.round(loadMs),
    storageMb: mb(storageKb),
    historyEvents: Math.round(history),
    snapshotsStored: Math.round(snapshots),
  };
}

export function run({ aggregates, eventsPerAggregate, longLivedEvents, replayEventsPerSec, snapshotEvery, eventKb, stateKb, snapshotKb }) {
  const totalEvents = aggregates * eventsPerAggregate;
  const replayMs = (events) => (events / replayEventsPerSec) * 1000;

  const state = outcome({ loadMs: STATE_READ_MS, storageKb: aggregates * stateKb, history: 0, snapshots: 0 });
  const events = outcome({ loadMs: replayMs(eventsPerAggregate), storageKb: totalEvents * eventKb, history: totalEvents, snapshots: 0 });
  const busiest = outcome({ loadMs: replayMs(longLivedEvents), storageKb: totalEvents * eventKb, history: totalEvents, snapshots: 0 });
  const snapshotted = outcome({
    loadMs: STATE_READ_MS + replayMs(Math.min(longLivedEvents, snapshotEvery)),
    storageKb: totalEvents * eventKb + aggregates * snapshotKb,
    history: totalEvents,
    snapshots: aggregates,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Update the state in place",
        note: `Each account is one row, read in ${state.loadStateMs} ms, and ${state.storageMb.toLocaleString("en-US")} MB in all. But a customer disputes a payment and there is no history: who changed the status, and when? Nothing kept ${state.historyEvents} events.`,
        metrics: state,
      },
      {
        beat: "component",
        title: "Store every change as an event",
        note: `State changes are appended as immutable events, ${events.historyEvents.toLocaleString("en-US")} of them, and the current state is a replay of an account's ${eventsPerAggregate} events: ${events.loadStateMs} ms to load. The full audit trail is there, for ${events.storageMb.toLocaleString("en-US")} MB.`,
        metrics: events,
      },
      {
        beat: "failure",
        title: `A busy account with ${longLivedEvents.toLocaleString("en-US")} events`,
        note: `Loading it means replaying every event, ${busiest.loadStateMs.toLocaleString("en-US")} ms at ${replayEventsPerSec.toLocaleString("en-US")} events a second. The longer an account lives, the slower it is to load, without limit.`,
        metrics: busiest,
      },
      {
        beat: "tradeoff",
        title: `A snapshot every ${snapshotEvery.toLocaleString("en-US")} events`,
        note: `Loading reads the latest snapshot and replays at most ${Math.min(longLivedEvents, snapshotEvery).toLocaleString("en-US")} events: ${snapshotted.loadStateMs} ms. It costs ${snapshotted.snapshotsStored.toLocaleString("en-US")} snapshots and a rule for when to write them. The snapshot is only a cache, since the events remain the truth.`,
        metrics: snapshotted,
      },
    ],
    summary: { replayAllMs: busiest.loadStateMs, snapshotMs: snapshotted.loadStateMs },
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
