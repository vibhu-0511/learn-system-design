// m01 sim: a constraints-first checker. Given the forces on a system, which components are justified?
// Assumptions: the rules mirror the vault's constraint table, and the thresholds are the sim's own
// round numbers: a load balancer once total traffic passes 500 req/s (one app server), a cache at a
// read:write ratio of 20 or more, read replicas above 10,000 reads/s (one PostgreSQL), a queue at
// 1,000 writes/s or more, sharding above 5,000 writes/s, a CDN or multi-region when half the users are
// global, microservices only with a team of 20 or more. The "template" design is the four boxes
// people draw first: load balancer, app server, database, cache.
// Runs in Node (node sim.mjs --writeRps=2000) and in the browser.

export const PARAMS = {
  writeRps: { label: "Writes", unit: "req/s", min: 1, max: 50000, step: 1, default: 1200 },
  readRatio: { label: "Reads per write", unit: "x", min: 1, max: 1000, step: 1, default: 20 },
  globalPct: { label: "Users outside home region", unit: "%", min: 0, max: 100, step: 5, default: 60 },
  teamSize: { label: "Engineers", unit: "people", min: 1, max: 100, step: 1, default: 4 },
  strictConsistency: { label: "Strong consistency needed (1 = yes)", unit: "", min: 0, max: 1, step: 1, default: 1 },
};

const TEMPLATE = ["load balancer", "app server", "cache", "database"];

// name -> does the constraint justify it?
function rules({ writeRps, readRps, globalPct, teamSize, strictConsistency }) {
  return {
    "load balancer": readRps + writeRps > 500,
    "app server": true,
    "database": true,
    "cache": readRps / Math.max(writeRps, 1) >= 20 && !strictConsistency,
    "read replicas": readRps > 10000,
    "queue": writeRps >= 1000,
    "sharded write store": writeRps > 5000,
    "CDN and multi-region": globalPct >= 50,
    "microservices": teamSize >= 20,
  };
}

export function run(params) {
  const { writeRps, readRatio } = params;
  const readRps = writeRps * readRatio;
  const table = rules({ ...params, readRps });
  const all = Object.keys(table);
  const needed = all.filter((k) => table[k]);
  const fmt = (n) => n.toLocaleString("en-US");
  const pct = (a, b) => (b === 0 ? 100 : Math.round((a / b) * 100));

  const metricsFor = (drawn) => {
    const unjustified = drawn.filter((c) => !table[c]);
    const missing = needed.filter((c) => !drawn.includes(c));
    return {
      readRps,
      needed: needed.length,
      drawn: drawn.length,
      unjustified: unjustified.length,
      missing: missing.length,
      precisionPct: pct(drawn.length - unjustified.length, drawn.length),
    };
  };
  const tmpl = metricsFor(TEMPLATE);
  const unjustifiedT = TEMPLATE.filter((c) => !table[c]);
  const missingT = needed.filter((c) => !TEMPLATE.includes(c));
  const over = metricsFor(all);

  return {
    frames: [
      {
        beat: "constraints",
        title: `${fmt(writeRps)} writes and ${fmt(readRps)} reads a second, team of ${params.teamSize}`,
        note: `Start with the forces, not the boxes: ${readRatio} reads per write, ${params.globalPct}% of users outside the home region, ${params.strictConsistency ? "strong consistency required" : "eventual consistency acceptable"}. Each force either justifies a component or it does not.`,
        metrics: { readRps, needed: 0, drawn: 0, unjustified: 0, missing: 0, precisionPct: 0 },
      },
      {
        beat: "component",
        title: `Constraints first: ${needed.length} components, each with a reason`,
        note: `The forces justify: ${needed.join(", ")}. Nothing is drawn that a constraint did not ask for, and nothing is missing.`,
        metrics: metricsFor(needed),
      },
      {
        beat: "failure",
        title: "Template first: four boxes drawn from habit",
        note: `Load balancer, app server, cache, database. ${unjustifiedT.length ? `Not justified here: ${unjustifiedT.join(", ")}.` : "Every box happens to be justified."} ${missingT.length ? `Missing: ${missingT.join(", ")}.` : "Nothing is missing."} Asked "why these?", the answer is "it is what you draw".`,
        metrics: tmpl,
      },
      {
        beat: "tradeoff",
        title: `The opposite mistake: all ${all.length} components on day one`,
        note: `Drawing everything covers every need, but ${over.unjustified} of ${over.drawn} components have no force behind them. Each is a service to run, monitor and pay for. Precision falls to ${over.precisionPct}%. Start with the ${needed.length} justified ones and show the path to the rest.`,
        metrics: over,
      },
    ],
    summary: { needed: needed.length, templateMissing: missingT.length },
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
