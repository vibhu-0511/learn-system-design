// p15 sim: how many users one bad deploy reaches, with one shared stack or with cells.
// Assumptions: users are spread evenly over `cells` self-contained copies of the service, each
// with its own data, behind a router that maps a user to a cell; every extra cell adds
// `cellOverheadPct` of the single stack's cost (spare capacity, its own database, tooling); a
// bad deploy needs `detectMin` to be noticed and rolled back; a staged rollout deploys one cell,
// waits `bakeMin`, then does the next; deploying every cell at once takes 5 minutes.
// Runs in Node (node sim.mjs --cells=10) and in the browser.

export const PARAMS = {
  cells: { label: "Cells", unit: "", min: 1, max: 100, step: 1, default: 50 },
  detectMin: { label: "Time to notice a bad deploy", unit: "min", min: 1, max: 60, step: 1, default: 10 },
  bakeMin: { label: "Wait between cells", unit: "min", min: 5, max: 120, step: 5, default: 30 },
  cellOverheadPct: { label: "Cost of each extra cell", unit: "%", min: 0, max: 5, step: 0.1, default: 0.5 },
};

const ALL_AT_ONCE_MIN = 5;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ affectedShare, cells, cellOverheadPct, rolloutMin }) {
  return {
    usersAffectedPct: round1(affectedShare * 100),
    infraCostIndex: Math.round(100 + (cells - 1) * cellOverheadPct),
    rolloutMinutes: rolloutMin,
  };
}

export function run({ cells, detectMin, bakeMin, cellOverheadPct }) {
  const shared = outcome({ affectedShare: 1, cells: 1, cellOverheadPct, rolloutMin: ALL_AT_ONCE_MIN });
  const oneCell = outcome({ affectedShare: 1 / cells, cells, cellOverheadPct, rolloutMin: ALL_AT_ONCE_MIN });
  const everywhere = outcome({ affectedShare: 1, cells, cellOverheadPct, rolloutMin: ALL_AT_ONCE_MIN });
  const staged = outcome({ affectedShare: 1 / cells, cells, cellOverheadPct, rolloutMin: (cells - 1) * bakeMin + ALL_AT_ONCE_MIN });

  return {
    frames: [
      {
        beat: "constraints",
        title: "One shared stack",
        note: `A bad deploy corrupts data in the one shared database. Every user is hit: ${shared.usersAffectedPct}% of users for the ${detectMin} minutes it takes to notice, and the repair is on shared data.`,
        metrics: shared,
      },
      {
        beat: "component",
        title: `${cells} cells, each a full copy`,
        note: `Users are split over ${cells} cells, each with its own data. A bad deploy or bad data that lands in one cell hurts ${oneCell.usersAffectedPct}% of users; the rest never notice. The price is a cost index of ${oneCell.infraCostIndex} instead of 100.`,
        metrics: oneCell,
      },
      {
        beat: "failure",
        title: "Deploying to every cell at once",
        note: `Cells only limit a failure that starts in one cell. A deploy that goes to all ${cells} cells together still reaches ${everywhere.usersAffectedPct}% of users, and you are paying ${everywhere.infraCostIndex} for isolation you did not use.`,
        metrics: everywhere,
      },
      {
        beat: "tradeoff",
        title: `Staged rollout: one cell, then wait ${bakeMin} min`,
        note: `Deploy to one cell and watch. A bad build is caught after ${detectMin} minutes with only ${staged.usersAffectedPct}% of users affected. The cost is speed: a full rollout takes ${staged.rolloutMinutes.toLocaleString("en-US")} minutes instead of ${ALL_AT_ONCE_MIN}.`,
        metrics: staged,
      },
    ],
    summary: { sharedPct: shared.usersAffectedPct, stagedPct: staged.usersAffectedPct },
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
