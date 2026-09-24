// t03 sim: a decision calculator for a social feed ("posts from the people I follow") and a write surge.
// Assumptions: a user follows `follows` people; in SQL the feed is one JOIN that takes 20 ms plus
// 0.12 ms per followed user; in a document store the app makes one query for the user, one for the
// follow list and one per followed person, each taking `queryMs` (16 ms reproduces the vault note's
// 8 seconds for 500 followers), then sorts in code; one SQL primary handles `sqlWriteCapRps`
// writes a second and cannot be split easily while queries JOIN across tables; a document store
// node handles `nosqlNodeWriteCapRps` and scales out by adding nodes; after the surge, writes grow
// `growthX` times; the polyglot design keeps relationships in SQL and the write-heavy data in the
// document store.
// Runs in Node (node sim.mjs --growthX=20) and in the browser.

export const PARAMS = {
  follows: { label: "People followed", unit: "", min: 10, max: 2000, step: 10, default: 500 },
  queryMs: { label: "One document query", unit: "ms", min: 1, max: 50, step: 1, default: 16 },
  writesPerSec: { label: "Writes now", unit: "per s", min: 100, max: 20000, step: 100, default: 4000 },
  growthX: { label: "Write growth", unit: "x", min: 1, max: 30, step: 1, default: 10 },
  sqlWriteCapRps: { label: "One SQL primary", unit: "writes/s", min: 1000, max: 50000, step: 1000, default: 10000 },
  nosqlNodeWriteCapRps: { label: "One document-store node", unit: "writes/s", min: 1000, max: 50000, step: 1000, default: 15000 },
};

function outcome({ pageMs, queries, capRps, writes }) {
  return {
    feedPageMs: Math.round(pageMs),
    queriesPerPage: queries,
    writeCapacityRps: Math.round(capRps),
    writeLoadPct: Math.round((writes / capRps) * 100),
  };
}

export function run({ follows, queryMs, writesPerSec, growthX, sqlWriteCapRps, nosqlNodeWriteCapRps }) {
  const grown = writesPerSec * growthX;
  const joinMs = 20 + follows * 0.12;
  const docQueries = follows + 2;
  const nodes = Math.ceil(grown / (nosqlNodeWriteCapRps * 0.7));
  const nodesNow = Math.max(1, Math.ceil(writesPerSec / (nosqlNodeWriteCapRps * 0.7)));
  const fmt = (n) => n.toLocaleString("en-US");

  const start = outcome({ pageMs: 0, queries: 0, capRps: 1, writes: 0 });
  const sql = outcome({ pageMs: joinMs, queries: 1, capRps: sqlWriteCapRps, writes: writesPerSec });
  const doc = outcome({ pageMs: docQueries * queryMs, queries: docQueries, capRps: nodesNow * nosqlNodeWriteCapRps, writes: writesPerSec });
  const wall = outcome({ pageMs: joinMs, queries: 1, capRps: sqlWriteCapRps, writes: grown });
  const mixed = outcome({ pageMs: joinMs, queries: 1, capRps: nodes * nosqlNodeWriteCapRps, writes: grown });

  return {
    frames: [
      {
        beat: "constraints",
        title: "A feed with relationships, then a write surge",
        note: `Users follow ${follows} people and the feed must show their latest posts. Writes are ${fmt(writesPerSec)} a second now and will grow ${growthX}x to ${fmt(grown)}.`,
        metrics: start,
      },
      {
        beat: "component",
        title: "SQL: the feed is one JOIN",
        note: `The relational model answers in ${sql.feedPageMs} ms with ${sql.queriesPerPage} query. A single primary handles ${fmt(sqlWriteCapRps)} writes a second, so today's load is ${sql.writeLoadPct}%.`,
        metrics: sql,
      },
      {
        beat: "failure",
        title: "A document store for relationships",
        note: `Without JOINs the app fetches the user, the follow list and ${follows} people's posts one query at a time: ${fmt(doc.queriesPerPage)} queries, ${fmt(doc.feedPageMs)} ms a page. Writes are easy to scale (${nodesNow} node${nodesNow > 1 ? "s" : ""}, load ${doc.writeLoadPct}%), but the feed is the product.`,
        metrics: doc,
      },
      {
        beat: "tradeoff",
        title: `At ${growthX}x writes: SQL hits its wall, so split by access pattern`,
        note: `One SQL primary would be at ${wall.writeLoadPct}% and needs sharding (hard with cross-table JOINs). Keep relationships in SQL (${mixed.feedPageMs} ms feeds) and put the write-heavy events in a document store on ${nodes} node${nodes > 1 ? "s" : ""}: load ${mixed.writeLoadPct}%. The price is two systems to run and no JOIN between them.`,
        metrics: mixed,
      },
    ],
    summary: { sqlFeedMs: sql.feedPageMs, docFeedMs: doc.feedPageMs, sqlWallLoadPct: wall.writeLoadPct },
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
