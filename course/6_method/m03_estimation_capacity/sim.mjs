// m03 sim: back-of-envelope estimation to infrastructure, plus grading a napkin guess.
// Logic ported from the app's capacity.js (traffic, storage, bandwidth, cost bands) and napkinCheck.js
// (a guess is spot-on within 2x, close within 10x, otherwise off). Vault rules: seconds in a day are
// about 86,400; peak is a multiple of average (x3); servers = peak / per-server QPS x a 1.5 safety
// factor; an app server is about 500 QPS; a c5.2xlarge is about $250 a month; S3 is about $23 a TB.
// Assumptions not in the vault: the share of actions that are writes, that reads carry the payload
// over the network at peak, and that stored data is the write volume kept for the whole retention.
// Runs in Node (node sim.mjs --dauM=10) and in the browser.

export const PARAMS = {
  dauM: { label: "Daily active users", unit: "million", min: 1, max: 500, step: 1, default: 100 },
  actionsPerUser: { label: "Actions per user per day", unit: "", min: 1, max: 50, step: 1, default: 10 },
  writeSharePct: { label: "Share of actions that write", unit: "%", min: 1, max: 50, step: 1, default: 10 },
  peakMult: { label: "Peak over average", unit: "x", min: 1, max: 5, step: 0.5, default: 3 },
  payloadKB: { label: "Payload per action", unit: "KB", min: 1, max: 500, step: 1, default: 5 },
  retentionYears: { label: "Retention", unit: "years", min: 1, max: 10, step: 1, default: 5 },
  qpsPerServer: { label: "One app server handles", unit: "req/s", min: 100, max: 5000, step: 100, default: 500 },
  guessFactor: { label: "Your napkin guess, as a multiple of the truth", unit: "x", min: 0.1, max: 10, step: 0.1, default: 1.5 },
};

const SECONDS_PER_DAY = 86400;
const SAFETY = 1.5;
const SERVER_USD = 250;
const STORAGE_USD_PER_TB = 23;
const REPLICATION = 3;

// napkinCheck.js: within 2x is spot-on, within 10x is close, otherwise off.
function grade(value, expected) {
  const ratio = Math.max(value / expected, expected / value);
  return { ratio, score: ratio <= 2 ? 2 : ratio <= 10 ? 1 : 0 };
}

export function run(params) {
  const { dauM, actionsPerUser, writeSharePct, peakMult, payloadKB, retentionYears, qpsPerServer, guessFactor } = params;
  const avgRps = (dauM * 1e6 * actionsPerUser) / SECONDS_PER_DAY;
  const peakRps = avgRps * peakMult;
  const writeRps = avgRps * (writeSharePct / 100);
  const storageTB = (writeRps * SECONDS_PER_DAY * 365 * retentionYears * payloadKB * REPLICATION) / 1e9;
  const egressMbps = (peakRps * (1 - writeSharePct / 100) * payloadKB * 8) / 1000;
  const round = Math.round;
  const fmt = (n) => round(n).toLocaleString("en-US");

  const serversFull = Math.ceil((peakRps / qpsPerServer) * SAFETY);
  const serversAvg = Math.max(1, Math.ceil(avgRps / qpsPerServer));
  const load = (servers) => round((peakRps / (servers * qpsPerServer)) * 100);
  const cost = (servers) => round(servers * SERVER_USD + storageTB * STORAGE_USD_PER_TB);
  const g = grade(guessFactor * peakRps, peakRps);

  const metrics = (servers, extra = {}) => ({
    avgRps: round(avgRps),
    peakRps: round(peakRps),
    servers,
    peakLoadPct: load(servers),
    storageTB: round(storageTB),
    egressMbps: round(egressMbps),
    monthlyCostUsd: cost(servers),
    guessRatio: 0,
    gradeScore: 0,
    ...extra,
  });
  const gradeName = ["off", "close", "spot-on"][g.score];

  return {
    frames: [
      {
        beat: "constraints",
        title: `${dauM}M daily users, ${actionsPerUser} actions each`,
        note: `${dauM}M x ${actionsPerUser} = ${fmt(dauM * actionsPerUser)}M actions a day. Divide by about 86,400 seconds: roughly ${fmt(avgRps)} requests a second on average. Rule of thumb: 1M a day is about 12 a second.`,
        metrics: { ...metrics(0), peakRps: 0, peakLoadPct: 0, storageTB: 0, egressMbps: 0, monthlyCostUsd: 0 },
      },
      {
        beat: "component",
        title: `Peak x${peakMult}, then ${fmt(serversFull)} servers with a 1.5 safety factor`,
        note: `Peak is ${fmt(peakRps)} requests a second. ${fmt(peakRps)} / ${qpsPerServer} per server x 1.5 = ${fmt(serversFull)} app servers, running at ${load(serversFull)}% of capacity at peak. Storage is ${fmt(storageTB)} TB (${retentionYears} years, 3 copies), egress ${fmt(egressMbps)} Mbps, about $${fmt(cost(serversFull))} a month.`,
        metrics: metrics(serversFull),
      },
      {
        beat: "failure",
        title: `Sizing for the average: ${fmt(serversAvg)} servers`,
        note: `The average load fits ${fmt(serversAvg)} servers, but traffic peaks at ${fmt(peakRps)} a second. At peak those servers face ${load(serversAvg)}% of what they can handle, so the service falls over exactly when people use it most.`,
        metrics: metrics(serversAvg),
      },
      {
        beat: "tradeoff",
        title: `A napkin guess is graded ${gradeName}`,
        note: `Your guess of ${fmt(guessFactor * peakRps)} peak requests a second is ${Math.round(g.ratio * 10) / 10}x from ${fmt(peakRps)}: ${gradeName}. Within 2x is enough to choose an architecture; within 10x, to know the order of magnitude. Exactness costs interview minutes that the design needs.`,
        metrics: metrics(serversFull, { guessRatio: Math.round(g.ratio * 10) / 10, gradeScore: g.score }),
      },
    ],
    summary: { peakRps: round(peakRps), servers: serversFull },
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
