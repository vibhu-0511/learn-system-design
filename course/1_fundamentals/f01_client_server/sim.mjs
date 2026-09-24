// f01 sim: users, servers and where a session lives.
// Assumptions: load spreads evenly, and every server is equally fast. A stateful
// server keeps each user's session in its own memory; a stateless one keeps it in a
// shared store, so any server can serve any request.
// Runs in Node (node sim.mjs --servers=6) and in the browser.

export const PARAMS = {
  clients: { label: "Active users", unit: "", min: 2000, max: 50000, step: 1000, default: 10000 },
  requestsPerMin: { label: "Requests per user", unit: "per min", min: 1, max: 30, step: 1, default: 6 },
  serverRps: { label: "One server's capacity", unit: "req/s", min: 100, max: 1000, step: 50, default: 400 },
  servers: { label: "Servers", unit: "", min: 2, max: 10, step: 1, default: 4 },
  storeMs: { label: "Session store lookup", unit: "ms", min: 0.5, max: 10, step: 0.5, default: 2 },
};

const round1 = (n) => Math.round(n * 10) / 10;

function measure(loadRps, servers, serverRps, { sessionsLostPct = 0, extraLatencyMs = 0 } = {}) {
  const capacity = servers * serverRps;
  return {
    loadRps: round1(loadRps),
    capacityRps: round1(capacity),
    utilizationPct: round1((loadRps / capacity) * 100),
    sessionsLostPct: round1(sessionsLostPct),
    extraLatencyMs: round1(extraLatencyMs),
  };
}

export function run({ clients, requestsPerMin, serverRps, servers, storeMs }) {
  const load = (clients * requestsPerMin) / 60;
  const alone = measure(load, 1, serverRps);
  const spread = measure(load, servers, serverRps);
  const crashed = measure(load, servers - 1, serverRps, { sessionsLostPct: 100 / servers });
  const shared = measure(load, servers - 1, serverRps, { extraLatencyMs: storeMs });

  return {
    frames: [
      {
        beat: "constraints",
        title: "One server for everyone",
        note: `${clients} users send ${alone.loadRps} req/s to one server that handles ${serverRps}. It runs at ${alone.utilizationPct}% utilization.`,
        metrics: alone,
      },
      {
        beat: "component",
        title: `${servers} servers, sessions in memory`,
        note: `A load balancer spreads the load: utilization falls to ${spread.utilizationPct}%. Each user is pinned to one server so their in-memory session is found.`,
        metrics: spread,
      },
      {
        beat: "failure",
        title: "One server crashes",
        note: `The ${crashed.sessionsLostPct}% of users pinned to it lose their session and must log in again, and the ${servers - 1} survivors now run at ${crashed.utilizationPct}%.`,
        metrics: crashed,
      },
      {
        beat: "tradeoff",
        title: "Move the session to a shared store",
        note: `Now any server can serve any user, so a crash loses no sessions. The price is a store lookup on every request: +${shared.extraLatencyMs} ms, and one more system that must stay up.`,
        metrics: shared,
      },
    ],
    summary: { utilizationPct: spread.utilizationPct, sessionsLostPct: crashed.sessionsLostPct },
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
