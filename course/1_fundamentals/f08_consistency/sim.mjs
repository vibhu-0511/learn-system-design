// f08 sim: how many replicas a write and a read must touch (quorums).
// Model: N replicas. A write is acknowledged by W of them; a read asks R of them at
// random. If W + R > N the read set must overlap the write set, so it sees the latest
// write. Otherwise the read may hit only replicas that missed it.
// Assumptions: replicas lag until they hear the write; the k-th fastest replica answers
// after replicaMs + (k - 1) * spreadMs; an operation fails if it needs more replicas
// than are alive. W and R are both set to the quorum size, clamped to the replica count.
// Runs in Node (node sim.mjs --quorum=4) and in the browser.

export const PARAMS = {
  replicas: { label: "Replicas", unit: "", min: 3, max: 9, step: 1, default: 5 },
  quorum: { label: "Quorum size", unit: "", min: 1, max: 9, step: 1, default: 3 },
  down: { label: "Replicas down", unit: "", min: 0, max: 4, step: 1, default: 2 },
  replicaMs: { label: "Fastest replica", unit: "ms", min: 2, max: 50, step: 1, default: 5 },
  spreadMs: { label: "Extra delay per slower replica", unit: "ms", min: 0, max: 20, step: 1, default: 3 },
};

const round1 = (n) => Math.round(n * 10) / 10;

function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i;
  return result;
}

// Chance that R random replicas all missed a write that reached W of N.
const staleProbability = (n, w, r) => (w + r > n ? 0 : choose(n - w, r) / choose(n, r));

function measure({ n, w, r, down, replicaMs, spreadMs }) {
  const alive = n - down;
  return {
    stalePct: round1(staleProbability(n, w, r) * 100),
    writeMs: round1(replicaMs + (w - 1) * spreadMs),
    readMs: round1(replicaMs + (r - 1) * spreadMs),
    availablePct: w <= alive && r <= alive ? 100 : 0,
  };
}

export function run({ replicas, quorum, down, replicaMs, spreadMs }) {
  const n = replicas;
  const q = Math.min(quorum, n);
  const common = { n, replicaMs, spreadMs };

  const fast = measure({ ...common, w: 1, r: 1, down: 0 });
  const overlap = measure({ ...common, w: q, r: q, down: 0 });
  const degraded = measure({ ...common, w: q, r: q, down });
  const readHeavy = measure({ ...common, w: n, r: 1, down });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Write to one, read from one",
        note: `Fast (${fast.writeMs} ms) but with ${n} replicas a random read misses the latest write ${fast.stalePct}% of the time.`,
        metrics: fast,
      },
      {
        beat: "component",
        title: `Quorums: W = R = ${q}`,
        note:
          q + q > n
            ? `${q} + ${q} > ${n}, so every read set overlaps every write set and stale reads drop to ${overlap.stalePct}%. Each operation waits for ${q} replicas: ${overlap.writeMs} ms.`
            : `${q} + ${q} is not more than ${n}, so the sets can miss each other: ${overlap.stalePct}% of reads are stale. Raise the quorum to at least ${Math.floor(n / 2) + 1}.`,
        metrics: overlap,
      },
      {
        beat: "failure",
        title: `${down} replicas down`,
        note:
          degraded.availablePct === 100
            ? `${n - down} replicas are alive and each operation needs ${q}, so the system keeps working and stays consistent.`
            : `Only ${n - down} replicas are alive but each operation needs ${q}, so reads and writes fail. A bigger quorum survives fewer failures.`,
        metrics: degraded,
      },
      {
        beat: "tradeoff",
        title: "Write to all, read from one",
        note: `Reads are cheap (${readHeavy.readMs} ms) and never stale, but every write waits for the slowest replica (${readHeavy.writeMs} ms) and stops entirely if any replica is down.`,
        metrics: readHeavy,
      },
    ],
    summary: { fastStalePct: fast.stalePct, quorumStalePct: overlap.stalePct },
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
