// p01 sim: finding rows in a big table with and without a B-tree index.
// Assumptions: a sequential scan reads a row in 0.0003 ms (10 million rows in 3 s, the vault
// note's scenario); each level of a B-tree costs 1 ms; fetching one row the index points at
// costs 0.002 ms (a random read is slower than a scan read); a table with no index takes one
// disk write per row change, and every index adds one more write.
// Runs in Node (node sim.mjs --rows=100000000) and in the browser.

export const PARAMS = {
  rows: { label: "Rows in the table", unit: "", min: 10000, max: 100000000, step: 10000, default: 10000000 },
  fanout: { label: "Keys per B-tree page", unit: "", min: 50, max: 1000, step: 50, default: 500 },
  matchPct: { label: "Rows the second query returns", unit: "%", min: 1, max: 90, step: 1, default: 30 },
  writesPerSec: { label: "Row writes", unit: "per s", min: 10, max: 10000, step: 10, default: 1000 },
  indexCount: { label: "Indexes on the table", unit: "", min: 1, max: 12, step: 1, default: 6 },
};

const SCAN_MS_PER_ROW = 0.0003;
const LEVEL_MS = 1;
const RANDOM_FETCH_MS = 0.002;

function outcome({ queryMs, rowsRead, indexes, writesPerSec }) {
  return {
    queryMs: Math.round(queryMs),
    rowsRead: Math.round(rowsRead),
    writeAmplification: 1 + indexes,
    diskWritesRps: writesPerSec * (1 + indexes),
  };
}

export function run({ rows, fanout, matchPct, writesPerSec, indexCount }) {
  const depth = Math.max(1, Math.ceil(Math.log(rows) / Math.log(fanout)));
  const matched = rows * (matchPct / 100);

  const scan = outcome({ queryMs: rows * SCAN_MS_PER_ROW, rowsRead: rows, indexes: 0, writesPerSec });
  const lookup = outcome({ queryMs: depth * LEVEL_MS + RANDOM_FETCH_MS, rowsRead: 1, indexes: 1, writesPerSec });
  const wide = outcome({ queryMs: depth * LEVEL_MS + matched * RANDOM_FETCH_MS, rowsRead: matched, indexes: 1, writesPerSec });
  const many = outcome({ queryMs: lookup.queryMs, rowsRead: 1, indexes: indexCount, writesPerSec });

  return {
    frames: [
      {
        beat: "constraints",
        title: "No index: read every row",
        note: `Looking up one email in ${rows.toLocaleString("en-US")} rows scans all of them: ${scan.queryMs.toLocaleString("en-US")} ms, and one write costs ${scan.diskWritesRps / writesPerSec} disk write.`,
        metrics: scan,
      },
      {
        beat: "component",
        title: `B-tree index: ${depth} levels`,
        note: `A B-tree with ${fanout} keys per page reaches any row in ${depth} page reads, so the same lookup takes ${lookup.queryMs} ms and reads ${lookup.rowsRead} row. Each write now costs ${lookup.writeAmplification} disk writes.`,
        metrics: lookup,
      },
      {
        beat: "failure",
        title: `An index on a query that returns ${matchPct}% of rows`,
        note: `Following the index for ${matched.toLocaleString("en-US")} rows means that many random fetches: ${wide.queryMs.toLocaleString("en-US")} ms, ${wide.queryMs > scan.queryMs ? "slower" : "faster"} than the ${scan.queryMs.toLocaleString("en-US")} ms scan. A planner would skip the index here.`,
        metrics: wide,
      },
      {
        beat: "tradeoff",
        title: `${indexCount} indexes: reads stay fast, writes multiply`,
        note: `Reads stay at ${many.queryMs} ms, but every row write now touches the table and ${indexCount} indexes: ${many.writeAmplification}x, or ${many.diskWritesRps.toLocaleString("en-US")} disk writes a second for ${writesPerSec.toLocaleString("en-US")} row writes.`,
        metrics: many,
      },
    ],
    summary: { scanMs: scan.queryMs, indexMs: lookup.queryMs },
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
