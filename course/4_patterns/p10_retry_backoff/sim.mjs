// p10 sim: many clients retry against one overloaded server.
// Model: time moves in 100 ms ticks. Each tick the server serves as many attempts as
// fit in that tick and rejects the rest (a 503, no queue). A rejected attempt retries
// according to a policy. Assumptions: every client starts at t=0, and the only
// failure is overload.
// Runs in Node (node sim.mjs --clients=2000) and in the browser.

export const PARAMS = {
  clients: { label: "Clients", unit: "", min: 100, max: 5000, step: 100, default: 1000 },
  capacityRps: { label: "Server capacity", unit: "req/s", min: 50, max: 2000, step: 50, default: 300 },
  maxRetries: { label: "Max retries", unit: "", min: 1, max: 10, step: 1, default: 6 },
  baseDelayMs: { label: "Base delay", unit: "ms", min: 100, max: 2000, step: 100, default: 1000 },
};

const TICK_MS = 100;
const HORIZON_TICKS = 1800; // three minutes of simulated time
const CAP_MS = 30000; // never wait longer than this between attempts
const SEED = 42;
const round1 = (n) => Math.round(n * 10) / 10;

// Small seeded generator (mulberry32) so every run gives the same answer.
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Delay before retry number `attempt` (1 = the first retry).
const POLICIES = {
  fixed: (base) => base,
  backoff: (base, attempt) => Math.min(CAP_MS, base * 2 ** (attempt - 1)),
  jitter: (base, attempt, rng) => rng() * Math.min(CAP_MS, base * 2 ** (attempt - 1)),
};

function simulate(policy, { clients, capacityRps, maxRetries, baseDelayMs }) {
  const rng = makeRng(SEED);
  const perTick = (capacityRps * TICK_MS) / 1000;
  const due = Array.from({ length: HORIZON_TICKS }, () => []);
  const failures = new Array(clients).fill(0);
  due[0] = Array.from({ length: clients }, (_, i) => i);
  let served = 0;
  let attemptsMade = 0;
  let lastEvent = 0;
  let carry = 0;

  for (let t = 0; t < HORIZON_TICKS; t += 1) {
    const load = due[t].length;
    if (load === 0) continue;
    attemptsMade += load;

    const budget = perTick + carry; // capacity left over from a fractional tick carries forward
    const ok = Math.min(load, Math.floor(budget));
    carry = ok < load ? budget - ok : 0;
    if (ok > 0) {
      served += ok;
      lastEvent = t;
    }

    for (const id of due[t].slice(ok)) {
      failures[id] += 1;
      const next = t + Math.max(1, Math.round(POLICIES[policy](baseDelayMs, failures[id], rng) / TICK_MS));
      if (failures[id] > maxRetries || next >= HORIZON_TICKS) lastEvent = t;
      else due[next].push(id);
    }
  }

  return {
    successPct: round1((served / clients) * 100),
    gaveUpPct: round1(((clients - served) / clients) * 100),
    attemptsPerClient: round1(attemptsMade / clients),
    settledSec: round1((lastEvent * TICK_MS) / 1000),
  };
}

export function run(params) {
  const { clients, capacityRps, maxRetries, baseDelayMs } = params;
  const fixed = simulate("fixed", params);
  const jitter = simulate("jitter", params);
  const backoff = simulate("backoff", params);
  const fewRetries = simulate("jitter", { ...params, maxRetries: Math.min(2, maxRetries) });

  return {
    frames: [
      {
        beat: "constraints",
        title: `Fixed ${baseDelayMs} ms retry`,
        note: `${clients} clients hit a server that handles ${capacityRps} req/s. They all fail together and retry together, so every wave gets only what one tick can serve: ${fixed.successPct}% succeed after ${fixed.attemptsPerClient} attempts each.`,
        metrics: fixed,
      },
      {
        beat: "component",
        title: "Exponential backoff with full jitter",
        note: `Each client waits a random time up to double the last wait. Retries spread out and ${jitter.successPct}% succeed, in ${jitter.settledSec} s.`,
        metrics: jitter,
      },
      {
        beat: "failure",
        title: "Backoff without jitter",
        note: `Backoff alone still retries in lockstep, at ${baseDelayMs} ms, then double, then double again. Waves stay synchronized: only ${backoff.successPct}% succeed, and it takes ${backoff.settledSec} s.`,
        metrics: backoff,
      },
      {
        beat: "tradeoff",
        title: "Jitter, capped at 2 retries",
        note: `Fewer retries mean less extra load (${fewRetries.attemptsPerClient} attempts per client instead of ${jitter.attemptsPerClient}), but ${fewRetries.gaveUpPct}% of clients give up.`,
        metrics: fewRetries,
      },
    ],
    summary: { fixedSuccessPct: fixed.successPct, jitterSuccessPct: jitter.successPct },
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
