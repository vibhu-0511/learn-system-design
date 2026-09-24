// p04 sim: which node owns each key, and how many keys move when one node is added.
// Assumptions: 20,000 keys and a fixed integer hash (no randomness, so runs repeat); "modulo"
// means node = hash(key) mod node count; the ring places each node at one or more hashed
// points on a 32-bit circle and gives a key to the first point at or after the key's hash;
// a "virtual node" is one such point (a physical node owns many); load is compared with a
// perfectly even share; ring entries are the points the router must keep sorted.
// Runs in Node (node sim.mjs --nodes=20) and in the browser.

export const PARAMS = {
  nodes: { label: "Nodes before the change", unit: "", min: 2, max: 50, step: 1, default: 10 },
  vnodes: { label: "Virtual nodes per node", unit: "", min: 1, max: 500, step: 1, default: 100 },
};

const KEYS = 20000;

function fmix(h) {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

const keyHashes = Array.from({ length: KEYS }, (_, k) => fmix(k + 1));

function buildRing(nodes, vnodes) {
  const points = [];
  for (let n = 0; n < nodes; n++) {
    for (let v = 0; v < vnodes; v++) points.push({ at: fmix(fmix(n + 1) ^ Math.imul(v + 1, 0x9e3779b1)), node: n });
  }
  return points.sort((a, b) => a.at - b.at);
}

function ringOwner(ring, h) {
  let lo = 0;
  let hi = ring.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ring[mid].at < h) lo = mid + 1;
    else hi = mid;
  }
  return ring[lo % ring.length].node;
}

function owners(nodes, scheme, vnodes) {
  if (scheme === "modulo") return keyHashes.map((h) => h % nodes);
  const ring = buildRing(nodes, vnodes);
  return keyHashes.map((h) => ringOwner(ring, h));
}

function outcome(nodes, scheme, vnodes) {
  const before = owners(nodes, scheme, vnodes);
  const after = owners(nodes + 1, scheme, vnodes);
  const moved = before.reduce((n, o, i) => n + (o !== after[i] ? 1 : 0), 0);
  const load = Array(nodes + 1).fill(0);
  after.forEach((o) => load[o]++);
  return {
    keysMovedPct: Math.round((moved / KEYS) * 100),
    busiestNodeVsEvenPct: Math.round((Math.max(...load) / (KEYS / (nodes + 1))) * 100),
    ringEntries: scheme === "modulo" ? 0 : (nodes + 1) * vnodes,
  };
}

export function run({ nodes, vnodes }) {
  const modulo = outcome(nodes, "modulo", 1);
  const ring = outcome(nodes, "ring", 1);
  const virtual = outcome(nodes, "ring", vnodes);
  const idealPct = Math.round(100 / (nodes + 1));

  return {
    frames: [
      {
        beat: "constraints",
        title: `Hash modulo ${nodes} nodes`,
        note: `Each key goes to hash mod ${nodes}. It is even, but adding one node changes the divisor: ${modulo.keysMovedPct}% of keys move, and a cache behind it loses most of its contents at once.`,
        metrics: modulo,
      },
      {
        beat: "component",
        title: "A hash ring, one point per node",
        note: `Nodes and keys share one circle, and a key belongs to the next node clockwise. A new node takes keys only from its neighbour, so only ${ring.keysMovedPct}% move (an even share for the new node would be ${idealPct}%).`,
        metrics: ring,
      },
      {
        beat: "failure",
        title: "One point per node gives uneven shares",
        note: `With one random point each, arcs differ in length: the busiest node holds ${ring.busiestNodeVsEvenPct}% of an even share, so one machine can run hot while others idle.`,
        metrics: ring,
      },
      {
        beat: "tradeoff",
        title: `${vnodes} virtual nodes per machine`,
        note: `Many small arcs per machine average out: ${virtual.keysMovedPct}% of keys move and the busiest node holds ${virtual.busiestNodeVsEvenPct}% of an even share. The price is a ring of ${virtual.ringEntries.toLocaleString("en-US")} entries to keep sorted and replicated.`,
        metrics: virtual,
      },
    ],
    summary: { moduloMovedPct: modulo.keysMovedPct, virtualMovedPct: virtual.keysMovedPct },
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
