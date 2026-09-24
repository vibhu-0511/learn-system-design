// t04 sim: a decision calculator for a startup choosing between a monolith and microservices.
// Assumptions: `engineers` people cost `engineerMonthUsd` a month (the vault note's $400K for
// 3 engineers over 8 months is about $16,700 each); a monolith launches in `monolithMonths` (the
// note's 6 weeks) and microservices in `microMonths` (its 8 months); one monolith deployment
// serves up to `monolithCapUsers`, and a microservice design up to `microCapUsers`; users grow
// `growthPct` a month from `users`; you must act when usage reaches 70% of capacity; a deploy
// takes 10 minutes for the monolith and 120 for the microservice pipeline (the note's 2 hours).
// Runs in Node (node sim.mjs --users=50000) and in the browser.

export const PARAMS = {
  users: { label: "Users at launch", unit: "", min: 1, max: 1000000, step: 1, default: 47 },
  growthPct: { label: "User growth a month", unit: "%", min: 1, max: 100, step: 1, default: 15 },
  engineers: { label: "Engineers", unit: "", min: 1, max: 30, step: 1, default: 3 },
  engineerMonthUsd: { label: "Cost of an engineer-month", unit: "$", min: 5000, max: 30000, step: 100, default: 16700 },
  monolithMonths: { label: "Months to launch a monolith", unit: "", min: 0.5, max: 6, step: 0.5, default: 1.5 },
  microMonths: { label: "Months to launch microservices", unit: "", min: 2, max: 24, step: 1, default: 8 },
  monolithCapUsers: { label: "Users one monolith serves", unit: "", min: 1000, max: 1000000, step: 1000, default: 100000 },
  microCapUsers: { label: "Users microservices serve", unit: "", min: 10000, max: 100000000, step: 10000, default: 1000000 },
};

const ACT_AT = 0.7;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ months, engineers, engineerMonthUsd, capUsers, deployMin, users, growthPct }) {
  const need = capUsers * ACT_AT;
  return {
    monthsToLaunch: months,
    buildCostUsd: Math.round(months * engineers * engineerMonthUsd),
    capacityUsers: capUsers,
    deployMinutes: deployMin,
    monthsUntilWall: users >= need ? 0 : round1(Math.log(need / users) / Math.log(1 + growthPct / 100)),
  };
}

export function run(p) {
  const base = { engineers: p.engineers, engineerMonthUsd: p.engineerMonthUsd, users: p.users, growthPct: p.growthPct };
  const mono = outcome({ ...base, months: p.monolithMonths, capUsers: p.monolithCapUsers, deployMin: 10 });
  const micro = outcome({ ...base, months: p.microMonths, capUsers: p.microCapUsers, deployMin: 120 });
  const fmt = (n) => n.toLocaleString("en-US");

  const saved = micro.buildCostUsd - mono.buildCostUsd;
  const start = { monthsToLaunch: 0, buildCostUsd: 0, capacityUsers: 0, deployMinutes: 0, monthsUntilWall: 0 };

  return {
    frames: [
      {
        beat: "constraints",
        title: `${fmt(p.users)} users and ${p.engineers} engineers`,
        note: `You are a small team with a product to find. Users grow ${p.growthPct}% a month. Every month spent building is a month a competitor may ship first.`,
        metrics: start,
      },
      {
        beat: "component",
        title: "A monolith: one codebase, one deploy",
        note: `${mono.monthsToLaunch} months to launch for $${fmt(mono.buildCostUsd)}. It serves up to ${fmt(mono.capacityUsers)} users, ${mono.monthsUntilWall > 0 ? `and at ${p.growthPct}% growth you reach 70% of that in ${mono.monthsUntilWall} months` : "and you are already past 70% of that"}. A deploy takes ${mono.deployMinutes} minutes.`,
        metrics: mono,
      },
      {
        beat: "failure",
        title: "Microservices on day one",
        note: `${micro.monthsToLaunch} months and $${fmt(micro.buildCostUsd)} to launch: $${fmt(saved)} more than the monolith, for capacity of ${fmt(micro.capacityUsers)} users that ${fmt(p.users)} users will not need for ${micro.monthsUntilWall} months. Each deploy takes ${micro.deployMinutes} minutes. The complexity was paid up front and used later, if ever.`,
        metrics: micro,
      },
      {
        beat: "tradeoff",
        title: "Monolith now, split at 70% of capacity",
        note: `Build the simple thing, keep its modules separable, and measure. You have ${mono.monthsUntilWall} months of growth before the wall, time to learn where the real bottleneck is. Splitting later costs a migration (see e04), but you pay it with real users and real revenue.`,
        metrics: mono,
      },
    ],
    summary: { monolithCostUsd: mono.buildCostUsd, microCostUsd: micro.buildCostUsd },
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
