// t06 sim: a decision calculator for a small product's monthly infrastructure bill.
// Assumptions: prices are rough monthly figures chosen to reproduce the vault note's $45,000 and
// $800 (a large instance $1,100, a small one $30, a managed database $300, hot storage
// $100 a TB, cold storage $10 a TB, $3,000 for cross-region replication of 3 regions); a small
// instance serves 500 daily users at 100% CPU and the design aims for 70%, with a minimum of 2
// instances for availability; a large instance serves 4,000; a single region answers in 80 ms for
// distant users and several regions in 30 ms; the gold-plated design does not change with load.
// Runs in Node (node sim.mjs --growthUsers=20000) and in the browser.

export const PARAMS = {
  users: { label: "Daily users now", unit: "", min: 10, max: 100000, step: 10, default: 50 },
  growthUsers: { label: "Daily users later", unit: "", min: 100, max: 1000000, step: 100, default: 5000 },
  latencyTargetMs: { label: "Latency target", unit: "ms", min: 20, max: 300, step: 10, default: 100 },
  fatRegions: { label: "Regions in the gold-plated design", unit: "", min: 1, max: 6, step: 1, default: 3 },
  fatInstancesPerRegion: { label: "Large instances per region", unit: "", min: 1, max: 30, step: 1, default: 10 },
  dataTb: { label: "Data stored", unit: "TB", min: 1, max: 200, step: 1, default: 30 },
  coldPct: { label: "Data nobody reads after 30 days", unit: "%", min: 0, max: 99, step: 1, default: 95 },
};

const LARGE_USD = 1100;
const SMALL_USD = 30;
const DB_USD = 300;
const HOT_TB_USD = 100;
const COLD_TB_USD = 10;
const REPLICATION_USD = 3000;
const SMALL_USERS = 500;
const LARGE_USERS = 4000;
const TARGET_CPU = 0.7;

function outcome({ cost, users, instances, capacityEach, latency }) {
  return {
    monthlyCostUsd: Math.round(cost),
    cpuUtilizationPct: Math.round((users / (instances * capacityEach)) * 1000) / 10,
    p95LatencyMs: latency,
    costPerUserUsd: Math.round((cost / users) * 10) / 10,
  };
}

export function run({ users, growthUsers, latencyTargetMs, fatRegions, fatInstancesPerRegion, dataTb, coldPct }) {
  const fmt = (n) => n.toLocaleString("en-US");
  const hotTb = dataTb * (1 - coldPct / 100);
  const tieredStorage = hotTb * HOT_TB_USD + (dataTb - hotTb) * COLD_TB_USD;

  const fatInstances = fatRegions * fatInstancesPerRegion;
  const fatCost = fatInstances * LARGE_USD + dataTb * HOT_TB_USD * fatRegions + (REPLICATION_USD * (fatRegions - 1)) / 2;
  const fatLatency = fatRegions > 1 ? 30 : 80;

  const smallFor = (u) => Math.max(2, Math.ceil(u / (SMALL_USERS * TARGET_CPU)));
  const rightCost = (n) => n * SMALL_USD + DB_USD + tieredStorage;

  const start = { monthlyCostUsd: 0, cpuUtilizationPct: 0, p95LatencyMs: 0, costPerUserUsd: 0 };
  const nowN = smallFor(users);
  const right = outcome({ cost: rightCost(nowN), users, instances: nowN, capacityEach: SMALL_USERS, latency: 80 });
  const fat = outcome({ cost: fatCost, users, instances: fatInstances, capacityEach: LARGE_USERS, latency: fatLatency });
  const laterN = smallFor(growthUsers);
  const later = outcome({ cost: rightCost(laterN), users: growthUsers, instances: laterN, capacityEach: SMALL_USERS, latency: 80 });

  return {
    frames: [
      {
        beat: "constraints",
        title: `${fmt(users)} users a day and a ${latencyTargetMs} ms target`,
        note: `A young product copies the architecture of a company with millions of users: multiple regions, large instances, real-time replication and hot storage for everything. What does the requirement actually need?`,
        metrics: start,
      },
      {
        beat: "component",
        title: "Right-sized: one region, small instances, tiered storage",
        note: `${nowN} small instances, a managed database and ${coldPct}% of the data on cold storage cost $${fmt(right.monthlyCostUsd)} a month at ${right.cpuUtilizationPct}% CPU and ${right.p95LatencyMs} ms, ${right.p95LatencyMs <= latencyTargetMs ? "inside" : "outside"} the ${latencyTargetMs} ms target.`,
        metrics: right,
      },
      {
        beat: "failure",
        title: "Gold-plated: the same product on the impressive design",
        note: `${fatRegions} region${fatRegions > 1 ? "s" : ""}, ${fatInstances} large instances and everything on hot storage cost $${fmt(fat.monthlyCostUsd)} a month: ${Math.round(fat.monthlyCostUsd / right.monthlyCostUsd)} times the right-sized bill, at ${fat.cpuUtilizationPct}% CPU. It buys ${fat.p95LatencyMs} ms latency that ${fmt(users)} users cannot tell from ${right.p95LatencyMs} ms.`,
        metrics: fat,
      },
      {
        beat: "tradeoff",
        title: `Scale the right-sized design to ${fmt(growthUsers)} users`,
        note: `Capacity is bought as load arrives: ${laterN} small instances at ${later.cpuUtilizationPct}% CPU, $${fmt(later.monthlyCostUsd)} a month, $${later.costPerUserUsd} a user instead of $${right.costPerUserUsd}. Buy performance when a measured limit or a latency target you are missing demands it, for example a second region only when ${right.p95LatencyMs} ms no longer meets the target.`,
        metrics: later,
      },
    ],
    summary: { rightSizedUsd: right.monthlyCostUsd, goldPlatedUsd: fat.monthlyCostUsd },
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
