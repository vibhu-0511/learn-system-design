// b02 sim: what an index buys a SQL query, and what it costs every write.
// Assumptions: a full scan reads one row per microsecond; a B-tree with a fanout of 100
// finds a row in ceil(log100(rows)) page reads at 0.1 ms each; every index adds 0.15 ms
// to each write and about 30% of the table's size; a base insert takes 0.2 ms.
// Runs in Node (node sim.mjs --rows=10000000) and in the browser.

export const PARAMS = {
  rows: { label: "Rows in the table", unit: "", min: 10000, max: 50000000, step: 10000, default: 1000000 },
  indexes: { label: "Indexes when you index everything", unit: "", min: 2, max: 12, step: 1, default: 8 },
};

const SCAN_MS_PER_ROW = 0.001;
const FANOUT = 100;
const PAGE_MS = 0.1;
const BASE_WRITE_MS = 0.2;
const INDEX_WRITE_MS = 0.15;
const INDEX_STORAGE = 0.3;
const round2 = (n) => Math.round(n * 100) / 100;

const pagesFor = (rows) => Math.max(1, Math.ceil(Math.log(rows) / Math.log(FANOUT)));

function outcome({ rowsExamined, queryMs, indexes }) {
  return {
    rowsExamined,
    queryMs: round2(queryMs),
    writeMs: round2(BASE_WRITE_MS + INDEX_WRITE_MS * indexes),
    indexes,
    storageFactor: round2(1 + INDEX_STORAGE * indexes),
  };
}

export function run({ rows, indexes }) {
  const scan = outcome({ rowsExamined: rows, queryMs: rows * SCAN_MS_PER_ROW, indexes: 0 });
  const pages = pagesFor(rows);
  const indexed = outcome({ rowsExamined: pages, queryMs: pages * PAGE_MS, indexes: 1 });
  // A leading wildcard or a function on the column cannot use the index, so it scans again.
  const blind = outcome({ rowsExamined: rows, queryMs: rows * SCAN_MS_PER_ROW, indexes: 1 });
  const everything = outcome({ rowsExamined: pages, queryMs: pages * PAGE_MS, indexes });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Find one row with a full scan",
        note: `${rows.toLocaleString("en-US")} rows and no index: the database reads every row, ${scan.queryMs} ms for one lookup, and it grows with the table.`,
        metrics: scan,
      },
      {
        beat: "component",
        title: "Add a B-tree index",
        note: `A balanced tree with a fanout of ${FANOUT} needs ${pages} page reads however big the table gets: ${indexed.queryMs} ms.`,
        metrics: indexed,
      },
      {
        beat: "failure",
        title: "A query that cannot use the index",
        note: `A leading wildcard like LIKE '%smith' or a function on the column bypasses the index and scans all ${rows.toLocaleString("en-US")} rows again: ${blind.queryMs} ms.`,
        metrics: blind,
      },
      {
        beat: "tradeoff",
        title: `Index every column (${indexes} indexes)`,
        note: `Reads stay fast (${everything.queryMs} ms) but every write must update ${indexes} indexes: ${everything.writeMs} ms instead of ${indexed.writeMs} ms, and the table takes ${everything.storageFactor}x the space.`,
        metrics: everything,
      },
    ],
    summary: { scanMs: scan.queryMs, indexedMs: indexed.queryMs },
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
