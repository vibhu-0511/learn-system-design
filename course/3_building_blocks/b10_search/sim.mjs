// b10 sim: searching a product catalogue with SQL LIKE versus an inverted index.
// Assumptions: a full scan reads 1.25 million rows a second (the vault note's 8 s for 10 million
// rows); an index reads 50 million postings (document ids) a second and has 1 ms of fixed
// overhead per query; the index stores about 200 bytes per document; the query has two terms
// that each appear in `rareTermPct` of documents and are intersected; the common word ("the")
// appears in `commonTermPct`. BM25 uses k1 = 1.2 and b = 0.75 (the vault note's defaults) and
// the Lucene form of IDF; a document of average length is compared at 3 and 30 occurrences.
// Runs in Node (node sim.mjs --docs=100000000) and in the browser.

export const PARAMS = {
  docs: { label: "Products", unit: "", min: 100000, max: 100000000, step: 100000, default: 10000000 },
  rareTermPct: { label: "Docs containing each query word", unit: "%", min: 0.1, max: 20, step: 0.1, default: 1 },
  commonTermPct: { label: "Docs containing a stop word", unit: "%", min: 50, max: 100, step: 1, default: 99 },
  refreshSec: { label: "Index refresh interval", unit: "s", min: 1, max: 60, step: 1, default: 1 },
};

const SCAN_ROWS_PER_SEC = 1250000;
const POSTINGS_PER_SEC = 50000000;
const INDEX_OVERHEAD_MS = 1;
const INDEX_BYTES_PER_DOC = 200;
const K1 = 1.2;
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

const idf = (docs, df) => Math.log(1 + (docs - df + 0.5) / (df + 0.5));
const bm25Tf = (tf) => (tf * (K1 + 1)) / (tf + K1);

function outcome({ docsTouched, queryMs, extraGb, staleSec }) {
  return {
    queryMs: Math.round(queryMs),
    docsTouched: Math.round(docsTouched),
    queriesPerSec: round1(1000 / Math.max(queryMs, 1)),
    extraStorageGb: round1(extraGb),
    staleSec,
  };
}

export function run({ docs, rareTermPct, commonTermPct, refreshSec }) {
  const scan = outcome({ docsTouched: docs, queryMs: (docs / SCAN_ROWS_PER_SEC) * 1000, extraGb: 0, staleSec: 0 });

  const extraGb = (docs * INDEX_BYTES_PER_DOC) / 1e9;
  const rarePostings = 2 * docs * (rareTermPct / 100);
  const indexed = outcome({
    docsTouched: rarePostings,
    queryMs: INDEX_OVERHEAD_MS + (rarePostings / POSTINGS_PER_SEC) * 1000,
    extraGb,
    staleSec: 0,
  });

  const commonPostings = docs * (commonTermPct / 100) + rarePostings / 2;
  const common = outcome({
    docsTouched: commonPostings,
    queryMs: INDEX_OVERHEAD_MS + (commonPostings / POSTINGS_PER_SEC) * 1000,
    extraGb,
    staleSec: 0,
  });

  const withIndex = { ...indexed, staleSec: refreshSec };

  const rareIdf = idf(docs, docs * (rareTermPct / 100));
  const commonIdf = idf(docs, docs * (commonTermPct / 100));
  return {
    frames: [
      {
        beat: "constraints",
        title: "LIKE '%wireless headphone%' scans every row",
        note: `A leading wildcard cannot use a B-tree index, so the database reads all ${scan.docsTouched.toLocaleString("en-US")} rows: ${scan.queryMs.toLocaleString("en-US")} ms a query, or ${scan.queriesPerSec} queries a second per core.`,
        metrics: scan,
      },
      {
        beat: "component",
        title: "Inverted index: term to documents",
        note: `The index maps each word to the documents holding it, so the query reads two posting lists (${indexed.docsTouched.toLocaleString("en-US")} ids) and intersects them: ${indexed.queryMs} ms, ${indexed.queriesPerSec} queries a second. It stores ${indexed.extraStorageGb} GB more.`,
        metrics: indexed,
      },
      {
        beat: "failure",
        title: "A stop word has a huge posting list",
        note: `A word in ${commonTermPct}% of documents, like "the", makes the query read ${common.docsTouched.toLocaleString("en-US")} ids and take ${common.queryMs} ms. It also says nothing about relevance: its IDF is ${round2(commonIdf)}, against ${round2(rareIdf)} for your ${rareTermPct}% words.`,
        metrics: common,
      },
      {
        beat: "tradeoff",
        title: "BM25 ranking, near-real-time index",
        note: `BM25 caps the gain from repeating a word: 30 occurrences score ${round2(bm25Tf(30))} against ${round2(bm25Tf(3))} for 3, not 10 times more. The price is a second copy of the data (${withIndex.extraStorageGb} GB) that is up to ${refreshSec} s behind the database.`,
        metrics: withIndex,
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
