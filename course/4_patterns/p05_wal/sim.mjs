// p05 sim: what a crash costs a database that keeps changes in memory, with and without a log.
// Assumptions: a write into memory takes about 0 ms; one fsync (forcing the log to disk) takes
// `fsyncMs` and the disk does one at a time, so demand above 1000 / fsyncMs a second cannot be
// met; without a log the data reaches disk only every `flushSec`; a log record is 0.5 KB; the
// log is replayed at 100 MB/s after a crash, from the last checkpoint (taken every
// `checkpointSec`); "lost" is the worst case: every acknowledged write since the last thing
// that reached disk.
// Runs in Node (node sim.mjs --fsyncMs=5) and in the browser.

export const PARAMS = {
  writesPerSec: { label: "Writes", unit: "per s", min: 10, max: 10000, step: 10, default: 1000 },
  fsyncMs: { label: "One fsync", unit: "ms", min: 0.1, max: 20, step: 0.1, default: 2 },
  flushSec: { label: "Flush interval without a log", unit: "s", min: 1, max: 300, step: 1, default: 30 },
  checkpointSec: { label: "Checkpoint interval", unit: "s", min: 5, max: 600, step: 5, default: 60 },
  groupMs: { label: "Group commit window", unit: "ms", min: 1, max: 50, step: 1, default: 5 },
};

const RECORD_KB = 0.5;
const REPLAY_MB_PER_SEC = 100;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ latencyMs, lost, fsyncsPerSec, fsyncMs, replaySec }) {
  return {
    commitLatencyMs: round1(latencyMs),
    writesLost: Math.round(lost),
    fsyncBusyPct: Math.round(((fsyncsPerSec * fsyncMs) / 1000) * 100),
    recoverySec: round1(replaySec),
  };
}

export function run({ writesPerSec, fsyncMs, flushSec, checkpointSec, groupMs }) {
  const replaySec = (writesPerSec * checkpointSec * RECORD_KB) / 1024 / REPLAY_MB_PER_SEC;

  const noLog = outcome({ latencyMs: 0, lost: writesPerSec * flushSec, fsyncsPerSec: 0, fsyncMs, replaySec: 0 });
  const perCommit = outcome({ latencyMs: fsyncMs, lost: 0, fsyncsPerSec: writesPerSec, fsyncMs, replaySec });
  const lazy = outcome({ latencyMs: 0, lost: writesPerSec, fsyncsPerSec: 1, fsyncMs, replaySec });
  const grouped = outcome({ latencyMs: fsyncMs + groupMs / 2, lost: 0, fsyncsPerSec: 1000 / groupMs, fsyncMs, replaySec });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Memory only, flushed every so often",
        note: `Writes are fast, but the data reaches disk every ${flushSec} s. A power cut loses up to ${noLog.writesLost.toLocaleString("en-US")} acknowledged writes at ${writesPerSec.toLocaleString("en-US")} a second.`,
        metrics: noLog,
      },
      {
        beat: "component",
        title: "Write-ahead log, fsync on every commit",
        note: `The change is appended to a log and forced to disk before the write is acknowledged: nothing is lost, and recovery replays about ${perCommit.recoverySec} s of log from the last checkpoint. But every commit waits ${fsyncMs} ms, and ${writesPerSec.toLocaleString("en-US")} fsyncs a second asks the disk to be ${perCommit.fsyncBusyPct}% busy.`,
        metrics: perCommit,
      },
      {
        beat: "failure",
        title: "The log without fsync",
        note: `Skipping the per-commit fsync (sync once a second) makes commits instant, but the log lives in the operating system's buffer, so a crash still loses up to ${lazy.writesLost.toLocaleString("en-US")} writes that were acknowledged.`,
        metrics: lazy,
      },
      {
        beat: "tradeoff",
        title: `Group commit every ${groupMs} ms`,
        note: `Writes that arrive within ${groupMs} ms share one fsync. Nothing is lost, the disk is ${grouped.fsyncBusyPct}% busy instead of ${perCommit.fsyncBusyPct}%, and a commit waits ${grouped.commitLatencyMs} ms on average. Recovery time still depends on the checkpoint interval (${checkpointSec} s).`,
        metrics: grouped,
      },
    ],
    summary: { noLogLost: noLog.writesLost, groupedBusyPct: grouped.fsyncBusyPct },
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
