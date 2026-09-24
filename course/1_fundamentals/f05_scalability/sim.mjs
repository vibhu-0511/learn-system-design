// f05 sim: scaling out versus scaling up.
// Model: Amdahl's law. A fraction of the work is serial (one shared database, one lock),
// so N servers give a speedup of 1 / (serial + (1 - serial) / N), never more than 1 / serial.
// Assumptions: identical servers, a fixed price per small server, and a bigger box that
// costs 1.5x more per unit of capacity.
// Runs in Node (node sim.mjs --serialPct=10) and in the browser.

export const PARAMS = {
  loadRps: { label: "Traffic", unit: "req/s", min: 500, max: 50000, step: 500, default: 8000 },
  perServerRps: { label: "One small server", unit: "req/s", min: 100, max: 2000, step: 50, default: 500 },
  serialPct: { label: "Work that cannot be split", unit: "%", min: 0, max: 30, step: 1, default: 2 },
  servers: { label: "Servers to scale out to", unit: "", min: 2, max: 100, step: 1, default: 40 },
  bigBox: { label: "Biggest machine, in small servers", unit: "x", min: 2, max: 32, step: 1, default: 8 },
};

const SMALL_COST = 100;
const BIG_BOX_PREMIUM = 1.5;
const round1 = (n) => Math.round(n * 10) / 10;

const speedup = (n, serial) => 1 / (serial + (1 - serial) / n);

// units = capacity bought, in small servers; machines = boxes that can fail on their own.
function measure(loadRps, perServerRps, { speed, units, machines, cost }) {
  const capacity = perServerRps * speed;
  return {
    capacityRps: round1(capacity),
    utilizationPct: round1((loadRps / capacity) * 100),
    speedup: round1(speed),
    efficiencyPct: round1((speed / units) * 100),
    monthlyCostUsd: cost,
    blastRadiusPct: round1(100 / machines),
  };
}

export function run({ loadRps, perServerRps, serialPct, servers, bigBox }) {
  const s = serialPct / 100;
  const one = measure(loadRps, perServerRps, { speed: 1, units: 1, machines: 1, cost: SMALL_COST });
  const out = measure(loadRps, perServerRps, { speed: speedup(servers, s), units: servers, machines: servers, cost: servers * SMALL_COST });
  const more = servers * 10;
  const tenX = measure(loadRps, perServerRps, { speed: speedup(more, s), units: more, machines: more, cost: more * SMALL_COST });
  const up = measure(loadRps, perServerRps, { speed: bigBox, units: bigBox, machines: 1, cost: Math.round(bigBox * SMALL_COST * BIG_BOX_PREMIUM) });

  return {
    frames: [
      {
        beat: "constraints",
        title: "One server",
        note: `${loadRps} req/s against a server that handles ${perServerRps}: utilization ${one.utilizationPct}%.`,
        metrics: one,
      },
      {
        beat: "component",
        title: `Scale out to ${servers} servers`,
        note: `A load balancer spreads traffic. With ${serialPct}% of the work serial the speedup is ${out.speedup}x, not ${servers}x, so capacity is ${out.capacityRps} req/s (utilization ${out.utilizationPct}%).`,
        metrics: out,
      },
      {
        beat: "failure",
        title: `Add ten times more servers (${more})`,
        note: `The serial work sets a ceiling of ${serialPct > 0 ? round1(1 / s) : "no limit"}x. Ten times the servers reach ${tenX.speedup}x at ${tenX.efficiencyPct}% efficiency, for ${tenX.monthlyCostUsd.toLocaleString("en-US")} dollars a month.`,
        metrics: tenX,
      },
      {
        beat: "tradeoff",
        title: `Scale up: one machine ${bigBox}x bigger`,
        note: `No load balancer and no serial penalty, but a hard ceiling: capacity ${up.capacityRps} req/s at utilization ${up.utilizationPct}%, and if it fails, ${up.blastRadiusPct}% of traffic fails with it.`,
        metrics: up,
      },
    ],
    summary: { outSpeedup: out.speedup, maxSpeedup: serialPct > 0 ? round1(1 / s) : null },
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
