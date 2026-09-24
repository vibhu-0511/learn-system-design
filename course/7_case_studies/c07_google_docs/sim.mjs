// c07 sim: Google Docs, an end-to-end capacity and bottleneck run for real-time editing.
// Assumptions: numbers come from the vault note (50M daily users, 10% editing at peak, 3 editors per
// document, 1 edit a second of 500 bytes each, 8 ms per operation = 1 transform + 5 persist +
// 2 broadcast, 10K connections per WebSocket server, 1K concurrent operations per processing server,
// 200 writes a second per database node, batches of 100 writes, about 790 servers for ~$500K a month).
// Assumed by this sim: cost is $633 per server-month (that $500K spread over 790 servers), a batched
// write waits for its batch to fill on its database node, one document is ordered by one server so it
// handles at most 1000 / 8 = 125 operations a second, and every editor's edit is sent to the other
// editors in the same document.
// Runs in Node (node sim.mjs --growth=10) and in the browser.

export const PARAMS = {
  dauM: { label: "Daily active users", unit: "M", min: 5, max: 200, step: 5, default: 50 },
  editorsPct: { label: "Editing at peak", unit: "%", min: 1, max: 30, step: 1, default: 10 },
  batch: { label: "Writes per batch", unit: "", min: 1, max: 500, step: 1, default: 100 },
  growth: { label: "Growth", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  hotEditors: { label: "Editors in one busy document", unit: "", min: 2, max: 200, step: 1, default: 100 },
  editorCap: { label: "Editors allowed to type at once", unit: "", min: 2, max: 200, step: 1, default: 100 },
};

const EDITS_PER_SEC = 1;
const OP_BYTES = 500;
const USERS_PER_DOC = 3;
const TRANSFORM_MS = 1;
const PERSIST_MS = 5;
const BROADCAST_MS = 2;
const OP_MS = TRANSFORM_MS + PERSIST_MS + BROADCAST_MS;
const WS_PER_SERVER = 10000;
const OPS_PER_PROC_SERVER = 1000;
const DB_WRITES_PER_NODE = 200;
const USD_PER_SERVER = 633;
const round1 = (n) => Math.round(n * 10) / 10;
const fmt = (n) => Math.round(n).toLocaleString("en-US");

function outcome({ users, batch, hotEditors }) {
  const opsRps = users * EDITS_PER_SEC;
  const procServers = Math.ceil((opsRps * OP_MS) / 1000 / OPS_PER_PROC_SERVER);
  const wsServers = Math.ceil(users / WS_PER_SERVER);
  const dbNodes = Math.ceil(opsRps / batch / DB_WRITES_PER_NODE);
  const fillMs = batch > 1 ? (batch / (opsRps / dbNodes)) * 1000 : 0;
  const docOpsRps = hotEditors * EDITS_PER_SEC;
  return {
    opsRps,
    wsServers,
    dbNodes,
    bandwidthGbps: round1((opsRps * OP_BYTES * 8 * USERS_PER_DOC) / 1e9),
    opLatencyMs: round1(OP_MS + fillMs),
    hotDocLoadPct: Math.round((docOpsRps / (1000 / OP_MS)) * 100),
    hotDocFanoutRps: hotEditors * (hotEditors - 1) * EDITS_PER_SEC,
    monthlyCostK: Math.round(((wsServers + procServers + dbNodes) * USD_PER_SERVER) / 1000),
  };
}

export function run({ dauM, editorsPct, batch, growth, hotEditors, editorCap }) {
  const users = dauM * 1e6 * (editorsPct / 100);
  const bigUsers = users * growth;
  const bigDoc = hotEditors * growth;

  const unbatched = outcome({ users, batch: 1, hotEditors });
  const batched = outcome({ users, batch, hotEditors });
  const grown = outcome({ users: bigUsers, batch, hotEditors: bigDoc });
  const cappedEditors = Math.min(bigDoc, editorCap);
  const capped = outcome({ users: bigUsers, batch, hotEditors: cappedEditors });

  return {
    frames: [
      {
        beat: "constraints",
        title: "One database write per edit",
        note: `${round1(users / 1e6)}M people type at peak, so ${fmt(unbatched.opsRps)} edits a second arrive, each ${OP_BYTES} bytes to ${USERS_PER_DOC - 1} other editors: ${unbatched.bandwidthGbps} Gbit/s. Writing every edit alone needs ${fmt(unbatched.dbNodes)} database nodes and about $${fmt(unbatched.monthlyCostK)}K a month.`,
        metrics: unbatched,
      },
      {
        beat: "component",
        title: `WebSocket servers, OT engine, batches of ${batch}`,
        note: `Each editor holds one WebSocket (${fmt(batched.wsServers)} servers). An OT engine orders each document's edits, and the database takes batches of ${batch}: ${fmt(batched.dbNodes)} nodes, ${batched.opLatencyMs} ms per edit, about $${fmt(batched.monthlyCostK)}K a month.`,
        metrics: batched,
      },
      {
        beat: "failure",
        title: `${growth}x users and a ${fmt(bigDoc)}-editor document`,
        note: `The fleet grows ${growth}x to ${fmt(grown.wsServers)} WebSocket servers and ${fmt(grown.dbNodes)} database nodes. Worse, one document ordered by one server now sees ${fmt(bigDoc)} editors: load at ${fmt(grown.hotDocLoadPct)}% of what a server can order, and ${fmt(grown.hotDocFanoutRps)} messages a second to send.`,
        metrics: grown,
      },
      {
        beat: "tradeoff",
        title: `Only ${editorCap} people can type at once`,
        note: `Extra people join as view-only. The busy document falls to ${cappedEditors} typists, ${fmt(capped.hotDocLoadPct)}% load and ${fmt(capped.hotDocFanoutRps)} messages a second. Nobody loses an edit, but the ${fmt(Math.max(0, bigDoc - cappedEditors))} people beyond the cap cannot type.`,
        metrics: capped,
      },
    ],
    summary: { opsRps: batched.opsRps, dbNodes: batched.dbNodes, hotDocLoadPct: capped.hotDocLoadPct },
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
