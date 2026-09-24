// p06 sim: a Bloom filter in front of a store, measured on real inserts and real misses.
// Assumptions: the store holds `keys` keys and a lookup of a key that is not there costs one
// disk read unless the filter says "no"; the filter is sized at `bitsPerKey` bits for `keys`
// keys and uses `hashes` hash functions (double hashing from one fixed integer hash, so runs
// repeat); the false-positive rate is measured on 50,000 keys that were never inserted; the
// theoretical rate is (1 - e^(-k*n/m))^k; an exact in-memory set would need about 20 bytes a key.
// Runs in Node (node sim.mjs --bitsPerKey=5) and in the browser.

export const PARAMS = {
  keys: { label: "Keys stored", unit: "", min: 10000, max: 100000, step: 10000, default: 100000 },
  bitsPerKey: { label: "Filter bits per key", unit: "", min: 2, max: 20, step: 1, default: 10 },
  hashes: { label: "Hash functions", unit: "", min: 1, max: 14, step: 1, default: 7 },
  overfill: { label: "Keys added beyond the plan", unit: "x", min: 1, max: 5, step: 1, default: 3 },
};

const QUERIES = 50000;
const EXACT_BYTES_PER_KEY = 20;
const round2 = (n) => Math.round(n * 100) / 100;

function fmix(h) {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function bitAt(key, i, bits) {
  const h1 = fmix(key + 1);
  const h2 = fmix(h1 ^ 0x9e3779b9) | 1;
  return ((h1 + Math.imul(i, h2)) >>> 0) % bits;
}

function measure({ planned, inserted, bitsPerKey, hashes }) {
  const bits = planned * bitsPerKey;
  const filter = new Uint8Array(bits);
  for (let key = 0; key < inserted; key++) for (let i = 0; i < hashes; i++) filter[bitAt(key, i, bits)] = 1;
  let falsePositives = 0;
  for (let q = 0; q < QUERIES; q++) {
    let present = true;
    for (let i = 0; i < hashes && present; i++) present = filter[bitAt(10000000 + q, i, bits)] === 1;
    if (present) falsePositives++;
  }
  const theory = (1 - Math.exp((-hashes * inserted) / bits)) ** hashes;
  const measured = falsePositives / QUERIES;
  return {
    filterMemoryMb: round2(bits / 8 / 1e6),
    falsePositivePct: round2(measured * 100),
    theoryFalsePositivePct: round2(theory * 100),
    diskReadsOnMissesPct: round2(measured * 100),
  };
}

export function run({ keys, bitsPerKey, hashes, overfill }) {
  const none = { filterMemoryMb: 0, falsePositivePct: 100, theoryFalsePositivePct: 100, diskReadsOnMissesPct: 100 };
  const plan = measure({ planned: keys, inserted: keys, bitsPerKey, hashes });
  const overfull = measure({ planned: keys, inserted: keys * overfill, bitsPerKey, hashes });
  const richer = measure({ planned: keys, inserted: keys, bitsPerKey: bitsPerKey * 2, hashes: Math.max(1, Math.round(bitsPerKey * 2 * Math.LN2)) });
  const exactMb = round2((keys * EXACT_BYTES_PER_KEY) / 1e6);

  return {
    frames: [
      {
        beat: "constraints",
        title: "No filter: every miss reads the disk",
        note: `A store of ${keys.toLocaleString("en-US")} keys is asked for keys that are not there, and each such lookup costs a disk read: 100% of misses. Keeping every key in memory to answer them would take about ${exactMb} MB.`,
        metrics: none,
      },
      {
        beat: "component",
        title: `Bloom filter: ${bitsPerKey} bits per key, ${hashes} hashes`,
        note: `Each key sets ${hashes} bits. A key with any bit unset is certainly absent. In ${plan.filterMemoryMb} MB the measured false-positive rate is ${plan.falsePositivePct}% (theory ${plan.theoryFalsePositivePct}%), so only that share of misses reaches the disk, and there are no false negatives.`,
        metrics: plan,
      },
      {
        beat: "failure",
        title: `${overfill}x more keys than the filter was sized for`,
        note: `A Bloom filter cannot grow. With ${overfill}x the planned keys the bit array fills up and the false-positive rate climbs to ${overfull.falsePositivePct}% (theory ${overfull.theoryFalsePositivePct}%): most of the benefit is gone.`,
        metrics: overfull,
      },
      {
        beat: "tradeoff",
        title: `Double the bits to ${bitsPerKey * 2} per key`,
        note: `More bits cut the false-positive rate to ${richer.falsePositivePct}% but cost ${richer.filterMemoryMb} MB instead of ${plan.filterMemoryMb} MB. The filter also cannot delete a key or list its contents: it only answers "possibly present" or "definitely not".`,
        metrics: richer,
      },
    ],
    summary: { planFalsePositivePct: plan.falsePositivePct, exactMb },
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
