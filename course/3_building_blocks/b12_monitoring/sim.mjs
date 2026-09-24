// b12 sim: one month of incidents against an error budget, with different levels of monitoring.
// Assumptions: a 30-day month (43,200 minutes); the error budget is (100% - SLO) of that;
// without monitoring an incident lasts `blindMin` (the vault's 4-hour 3 AM session); with metrics
// and alerts it takes `detectMin` to notice and `diagnoseMin` to find the cause using logs and
// traces; a CPU alert misses `cpuMissPct` of incidents (errors with normal CPU), which customers
// report after `customerReportMin` instead, and pages `cpuFalsePagesPerWeek` times a week for
// harmless CPU spikes; a burn-rate alert (budget spent too fast) pages about once a week
// (an assumption, since it fires only on real user impact).
// Runs in Node (node sim.mjs --sloPct=99.99) and in the browser.

export const PARAMS = {
  sloPct: { label: "SLO", unit: "%", min: 99, max: 99.99, step: 0.01, default: 99.9 },
  incidents: { label: "Incidents a month", unit: "", min: 1, max: 5, step: 1, default: 1 },
  blindMin: { label: "Incident length with no monitoring", unit: "min", min: 30, max: 480, step: 10, default: 240 },
  detectMin: { label: "Time to notice with an alert", unit: "min", min: 1, max: 30, step: 1, default: 5 },
  diagnoseMin: { label: "Time to find the cause", unit: "min", min: 1, max: 60, step: 1, default: 10 },
  customerReportMin: { label: "Time for customers to report", unit: "min", min: 5, max: 120, step: 5, default: 30 },
  cpuMissPct: { label: "Incidents a CPU alert misses", unit: "%", min: 0, max: 100, step: 5, default: 30 },
  cpuFalsePagesPerWeek: { label: "False CPU pages", unit: "per week", min: 0, max: 100, step: 1, default: 20 },
};

const MINUTES_PER_MONTH = 43200;
const BURN_RATE_PAGES_PER_WEEK = 1;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome(downtimeMin, budgetMin, falsePagesPerWeek) {
  return {
    downtimeMin: round1(downtimeMin),
    budgetUsedPct: Math.round((downtimeMin / budgetMin) * 100),
    budgetLeftMin: round1(Math.max(0, budgetMin - downtimeMin)),
    falsePagesPerWeek,
  };
}

export function run({ sloPct, incidents, blindMin, detectMin, diagnoseMin, customerReportMin, cpuMissPct, cpuFalsePagesPerWeek }) {
  const budgetMin = MINUTES_PER_MONTH * (1 - sloPct / 100);

  const blind = outcome(incidents * blindMin, budgetMin, 0);

  const observedMin = detectMin + diagnoseMin;
  const observed = outcome(incidents * observedMin, budgetMin, 0);

  const miss = cpuMissPct / 100;
  const cpuMin = (1 - miss) * observedMin + miss * (customerReportMin + diagnoseMin);
  const cpuAlerts = outcome(incidents * cpuMin, budgetMin, cpuFalsePagesPerWeek);

  const burnRate = outcome(incidents * observedMin, budgetMin, BURN_RATE_PAGES_PER_WEEK);

  return {
    frames: [
      {
        beat: "constraints",
        title: "A 3 AM incident with no monitoring",
        note: `The month's error budget at a ${sloPct}% SLO is ${round1(budgetMin)} minutes. ${incidents} incident${incidents > 1 ? "s" : ""} of ${blindMin} minutes with no metrics or traces use ${blind.budgetUsedPct}% of it.`,
        metrics: blind,
      },
      {
        beat: "component",
        title: "Metrics, logs and traces with an alert",
        note: `Metrics (RED for services) raise the alert in ${detectMin} minutes, and logs and traces find the cause in ${diagnoseMin}. Each incident is ${observedMin} minutes, so the month uses ${observed.budgetUsedPct}% of the budget, with ${observed.budgetLeftMin} minutes left.`,
        metrics: observed,
      },
      {
        beat: "failure",
        title: "Alerting on CPU",
        note: `A CPU threshold pages ${cpuFalsePagesPerWeek} times a week for spikes users never feel, so people start ignoring it, and it misses ${cpuMissPct}% of incidents. Those wait ${customerReportMin} minutes for customers to complain, pushing budget use to ${cpuAlerts.budgetUsedPct}%.`,
        metrics: cpuAlerts,
      },
      {
        beat: "tradeoff",
        title: "Alert on error-budget burn rate",
        note: `Paging only when the budget is being spent too fast ties alerts to user impact: about ${BURN_RATE_PAGES_PER_WEEK} page a week, and no incident waits for a customer. The cost is defining the SLO and a policy: ${burnRate.budgetLeftMin} minutes are left, and as they run out, releases slow down.`,
        metrics: burnRate,
      },
    ],
    summary: { budgetMin: round1(budgetMin), blindUsedPct: blind.budgetUsedPct },
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
