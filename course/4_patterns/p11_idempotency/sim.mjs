// p11 sim: a payment request whose response is sometimes lost, so the client retries.
// Assumptions: the server always processes the request it receives, but the response is lost
// with probability `lossPct`, and the client then retries up to `retries` times; the expected
// number of retried requests is payments * (p + p^2 + ... + p^retries); a key check in a fast
// store adds 2 ms; each stored key takes 100 bytes and is kept `retentionHours`; a check that
// reads the key and then writes it in two steps lets `racePct` of retries slip through when they
// arrive while the first attempt is still running.
// Runs in Node (node sim.mjs --lossPct=5) and in the browser.

export const PARAMS = {
  paymentsPerDay: { label: "Payments a day", unit: "", min: 10000, max: 10000000, step: 10000, default: 1000000 },
  lossPct: { label: "Responses lost", unit: "%", min: 0.1, max: 10, step: 0.1, default: 2 },
  retries: { label: "Client retries", unit: "", min: 1, max: 5, step: 1, default: 3 },
  amountUsd: { label: "Payment amount", unit: "$", min: 1, max: 500, step: 1, default: 40 },
  racePct: { label: "Retries that overlap the first attempt", unit: "%", min: 0, max: 50, step: 1, default: 5 },
  retentionHours: { label: "How long keys are kept", unit: "h", min: 1, max: 168, step: 1, default: 24 },
};

const CHECK_MS = 2;
const KEY_BYTES = 100;

function outcome({ duplicates, amountUsd, checkMs, keys }) {
  return {
    duplicateCharges: Math.round(duplicates),
    duplicateUsd: Math.round(duplicates * amountUsd),
    extraLatencyMs: checkMs,
    keyStorageMb: Math.round((keys * KEY_BYTES) / 1e6),
  };
}

export function run({ paymentsPerDay, lossPct, retries, amountUsd, racePct, retentionHours }) {
  const p = lossPct / 100;
  let retried = 0;
  for (let i = 1; i <= retries; i++) retried += paymentsPerDay * p ** i;
  const keys = (paymentsPerDay * retentionHours) / 24;

  const naive = outcome({ duplicates: retried, amountUsd, checkMs: 0, keys: 0 });
  const keyed = outcome({ duplicates: 0, amountUsd, checkMs: CHECK_MS, keys });
  const racy = outcome({ duplicates: (retried * racePct) / 100, amountUsd, checkMs: CHECK_MS, keys });
  const atomic = outcome({ duplicates: 0, amountUsd, checkMs: CHECK_MS, keys });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Retry without an idempotency key",
        note: `The server charges every request it receives. When the response is lost (${lossPct}% of ${paymentsPerDay.toLocaleString("en-US")} payments), the client retries and the customer is charged again: ${naive.duplicateCharges.toLocaleString("en-US")} duplicate charges, $${naive.duplicateUsd.toLocaleString("en-US")} a day.`,
        metrics: naive,
      },
      {
        beat: "component",
        title: "An idempotency key per payment",
        note: `The client sends the same key with every retry, and the server returns the stored result instead of charging again: ${keyed.duplicateCharges} duplicates. The check adds ${keyed.extraLatencyMs} ms and the keys take ${keyed.keyStorageMb} MB for ${retentionHours} hours.`,
        metrics: keyed,
      },
      {
        beat: "failure",
        title: "Check-then-write races with itself",
        note: `If the server reads the key and only then writes it, a retry that overlaps the first attempt finds nothing and charges too: ${racy.duplicateCharges.toLocaleString("en-US")} duplicates ($${racy.duplicateUsd.toLocaleString("en-US")}) when ${racePct}% of retries overlap.`,
        metrics: racy,
      },
      {
        beat: "tradeoff",
        title: "Insert the key atomically, and expire it",
        note: `Claiming the key with one atomic step (a unique constraint or SET NX) closes the race: ${atomic.duplicateCharges} duplicates. You pay ${atomic.extraLatencyMs} ms on every request and ${atomic.keyStorageMb} MB of keys, and a retry that arrives after ${retentionHours} hours would be charged as new.`,
        metrics: atomic,
      },
    ],
    summary: { naiveUsd: naive.duplicateUsd, atomicUsd: atomic.duplicateUsd },
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
