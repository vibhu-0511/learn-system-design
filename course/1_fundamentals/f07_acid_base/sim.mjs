// f07 sim: money transfers under crashes, with and without a transaction.
// Scenario: a transfer debits one account and credits another. A crash can land
// between the two steps.
// Assumptions: crashes hit a fixed share of transfers, a transaction costs a fixed
// share of throughput, and a BASE system serves reads from replicas that lag behind.
// Runs in Node (node sim.mjs --crashesPer1000=5) and in the browser.

export const PARAMS = {
  transfers: { label: "Transfers", unit: "", min: 1000, max: 100000, step: 1000, default: 10000 },
  crashesPer1000: { label: "Crashes per 1,000 transfers", unit: "", min: 0.5, max: 20, step: 0.5, default: 2 },
  avgDollars: { label: "Average transfer", unit: "$", min: 10, max: 500, step: 10, default: 50 },
  acidOverheadPct: { label: "Throughput a transaction costs", unit: "%", min: 0, max: 80, step: 5, default: 30 },
  replicaLagSec: { label: "Replica lag", unit: "s", min: 0.1, max: 30, step: 0.1, default: 3 },
};

const BASE_TPS = 1000;
const round1 = (n) => Math.round(n * 10) / 10;

const outcome = (tps, lostDollars, rolledBack, staleSec) => ({
  transfersPerSec: round1(tps),
  lostDollars: Math.round(lostDollars),
  rolledBack,
  staleSec: round1(staleSec),
});

export function run({ transfers, crashesPer1000, avgDollars, acidOverheadPct, replicaLagSec }) {
  const crashes = Math.round((transfers * crashesPer1000) / 1000);
  const acidTps = BASE_TPS * (1 - acidOverheadPct / 100);

  const clean = outcome(BASE_TPS, 0, 0, 0);
  const acid = outcome(acidTps, 0, crashes, 0);
  const unsafe = outcome(BASE_TPS, crashes * avgDollars, 0, 0);
  const base = outcome(BASE_TPS, 0, 0, replicaLagSec);

  return {
    frames: [
      {
        beat: "constraints",
        title: "No crashes",
        note: `${transfers} transfers of about $${avgDollars} each. Debit then credit, and the books balance: nothing is lost.`,
        metrics: clean,
      },
      {
        beat: "component",
        title: "One transaction (ACID)",
        note: `Debit and credit succeed together or not at all. ${crashes} crashes roll back cleanly and are retried, so $0 is lost. The cost: ${acidOverheadPct}% of throughput.`,
        metrics: acid,
      },
      {
        beat: "failure",
        title: "Two separate writes",
        note: `A crash between the debit and the credit leaves the money gone. ${crashes} crashes lose $${unsafe.lostDollars.toLocaleString("en-US")}, and nothing in the system knows.`,
        metrics: unsafe,
      },
      {
        beat: "tradeoff",
        title: "Relax to BASE for a like counter",
        note: `A like count needs no transaction, so it runs at full speed from replicas that may be ${replicaLagSec} s behind. Fine for likes, never for money.`,
        metrics: base,
      },
    ],
    summary: { crashes, lostWithoutTransaction: unsafe.lostDollars },
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
