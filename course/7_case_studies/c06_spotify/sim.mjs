// c06 sim: Spotify, an end-to-end capacity and bottleneck run for audio delivery.
// Assumptions: numbers come from the vault note (20M concurrent streams, 192 kbps average bitrate,
// 150 edge locations of 100 Gbit/s, origin egress $0.08/GB versus CDN $0.01/GB, edge start 20 ms
// versus origin 200 ms, 94% CDN hit rate). Assumed by this sim: the cache-warming hit rate is 98%,
// a busy edge is planned to run at 80% of its link, and a downshift lowers every stream to
// downshiftKbps. Cost counts delivery bandwidth only.
// Runs in Node (node sim.mjs --growth=10) and in the browser.

export const PARAMS = {
  concurrentM: { label: "Concurrent streams", unit: "M", min: 1, max: 50, step: 1, default: 20 },
  avgKbps: { label: "Average bitrate", unit: "kbps", min: 64, max: 320, step: 32, default: 192 },
  edges: { label: "Edge locations", unit: "", min: 50, max: 300, step: 10, default: 150 },
  cdnHitPct: { label: "CDN hit rate", unit: "%", min: 50, max: 99, step: 1, default: 94 },
  growth: { label: "Growth", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  downshiftKbps: { label: "Downshift bitrate", unit: "kbps", min: 32, max: 192, step: 32, default: 128 },
};

const EDGE_GBPS = 100;
const EDGE_TARGET = 0.8;
const ORIGIN_USD_GB = 0.08;
const CDN_USD_GB = 0.01;
const EDGE_MS = 20;
const ORIGIN_MS = 200;
const WARM_HIT_PCT = 98;
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => Math.round(n).toLocaleString("en-US");

// hitPct 0 means no CDN: every byte comes from the origin.
function outcome({ streams, kbps, hitPct, edges }) {
  const demandTbps = (streams * kbps) / 1e9;
  const hit = hitPct / 100;
  const gbPerHour = (demandTbps * 1000 / 8) * 3600;
  return {
    demandTbps: round2(demandTbps),
    originTbps: round2(demandTbps * (1 - hit)),
    edgesUsed: hitPct === 0 ? 0 : edges,
    edgeUtilPct: hitPct === 0 ? 0 : Math.round(((demandTbps * 1000) / edges / EDGE_GBPS) * 100),
    avgKbps: kbps,
    startMs: round1(hit * EDGE_MS + (1 - hit) * ORIGIN_MS),
    egressCostKPerHour: Math.round((gbPerHour * (hit * CDN_USD_GB + (1 - hit) * ORIGIN_USD_GB)) / 1000),
  };
}

export function run({ concurrentM, avgKbps, edges, cdnHitPct, growth, downshiftKbps }) {
  const streams = concurrentM * 1e6;
  const kbps2 = Math.min(downshiftKbps, avgKbps);
  const bigStreams = streams * growth;

  const noCdn = outcome({ streams, kbps: avgKbps, hitPct: 0, edges });
  const cdn = outcome({ streams, kbps: avgKbps, hitPct: cdnHitPct, edges });
  const grown = outcome({ streams: bigStreams, kbps: avgKbps, hitPct: cdnHitPct, edges });
  const needed = Math.ceil((bigStreams * kbps2) / 1e6 / (EDGE_GBPS * EDGE_TARGET));
  const shifted = outcome({ streams: bigStreams, kbps: kbps2, hitPct: Math.max(cdnHitPct, WARM_HIT_PCT), edges: needed });
  const neededFull = Math.ceil((bigStreams * avgKbps) / 1e6 / (EDGE_GBPS * EDGE_TARGET));

  return {
    frames: [
      {
        beat: "constraints",
        title: "Everything from the origin",
        note: `${concurrentM}M concurrent streams at ${avgKbps} kbps need ${noCdn.demandTbps} Tbit/s. With no CDN the origin serves all of it, costs $${fmt(noCdn.egressCostKPerHour)}K an hour in bandwidth and starts playback in ${noCdn.startMs} ms.`,
        metrics: noCdn,
      },
      {
        beat: "component",
        title: `Chunked audio behind a CDN (${cdnHitPct}% hits)`,
        note: `Songs are cut into chunks and cached on ${edges} edges. The origin now serves ${cdn.originTbps} Tbit/s, each edge carries about ${round1(cdn.edgeUtilPct)}% of its 100 Gbit/s link, playback starts in ${cdn.startMs} ms and bandwidth costs $${fmt(cdn.egressCostKPerHour)}K an hour.`,
        metrics: cdn,
      },
      {
        beat: "failure",
        title: `${growth}x concurrent listeners`,
        note: `${fmt(bigStreams / 1e6)}M streams need ${grown.demandTbps} Tbit/s. The same ${edges} edges would each run at ${fmt(grown.edgeUtilPct)}% of their link, and the origin sees ${grown.originTbps} Tbit/s of misses.`,
        metrics: grown,
      },
      {
        beat: "tradeoff",
        title: "Adaptive bitrate downshift and warm caches",
        note: `Dropping streams to ${kbps2} kbps and warming caches (${Math.max(cdnHitPct, WARM_HIT_PCT)}% hits) cuts the edges needed from ${fmt(neededFull)} to ${fmt(needed)} at 80% link use. Listeners get lower audio quality in return, and the bill is $${fmt(shifted.egressCostKPerHour)}K an hour.`,
        metrics: shifted,
      },
    ],
    summary: { demandTbps: cdn.demandTbps, originTbps: cdn.originTbps, edgesNeeded: needed },
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
