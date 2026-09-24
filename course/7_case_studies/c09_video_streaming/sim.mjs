// c09 sim: a video platform from requirements to a 10x day.
// Assumptions: the vault note gives 200M daily users, 5 views each, 500K uploads a day of 500 MB,
// 3 formats, a 720p stream of 2.5 Mbit/s and a 1080p stream of 5 Mbit/s. Everything else is assumed:
// peak traffic is 2x the daily average, one viewer watches 10 minutes, the whole origin can serve
// 5 Tbit/s, and startup takes 50 ms from an edge, 100 ms from a shield tier, 150 ms from the origin
// and 500 ms with no CDN (the note's 500 ms to 50 ms goal). Bandwidth is the size of the streams
// that are playing at once; nothing here models a single viewer's buffer.
// Runs in Node (node sim.mjs --cdnHitPct=95) and in the browser.

export const PARAMS = {
  dauM: { label: "Daily users", unit: "M", min: 50, max: 1000, step: 50, default: 200 },
  viewsPerUser: { label: "Views per user per day", unit: "", min: 1, max: 20, step: 1, default: 5 },
  watchMin: { label: "Minutes watched per view", unit: "min", min: 2, max: 60, step: 1, default: 10 },
  cdnHitPct: { label: "CDN hit rate", unit: "%", min: 50, max: 99, step: 1, default: 90 },
  spikeMultiplier: { label: "Traffic spike", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  shieldPct: { label: "Misses a shield tier absorbs", unit: "%", min: 0, max: 99, step: 1, default: 90 },
  renditions: { label: "Quality levels stored", unit: "", min: 1, max: 8, step: 1, default: 3 },
};

const PEAK_FACTOR = 2;
const RAW_MBPS = 5;
const ABR_MBPS = 2.5;
const ORIGIN_CAP_TBPS = 5;
const UPLOADS_PER_DAY = 500000;
const RAW_MB = 500;
const NO_CDN_MS = 500;
const EDGE_MS = 50;
const SHIELD_MS = 100;
const ORIGIN_MS = 150;
const round1 = (n) => Math.round(n * 10) / 10;

function serve({ viewsRps, watchMin, bitrate, hitPct, shieldPct = 0, shield = false, copies, cdn = true, tiers = 1 }) {
  const concurrentM = (viewsRps * watchMin * 60) / 1e6;
  const egressTbps = concurrentM * bitrate;
  const miss = cdn ? 1 - hitPct / 100 : 1;
  const originTbps = egressTbps * miss * (shield ? 1 - shieldPct / 100 : 1);
  const s = shieldPct / 100;
  const missMs = shield ? s * SHIELD_MS + (1 - s) * (SHIELD_MS + ORIGIN_MS) : ORIGIN_MS;
  return {
    viewsRps: Math.round(viewsRps),
    concurrentM: round1(concurrentM),
    egressTbps: round1(egressTbps),
    originTbps: round1(originTbps),
    originUtilPct: Math.round((originTbps / ORIGIN_CAP_TBPS) * 100),
    storageTbPerDay: Math.round((UPLOADS_PER_DAY * RAW_MB * copies) / 1e6),
    cacheTiers: cdn ? tiers : 0,
    startupMs: cdn ? Math.round((hitPct / 100) * EDGE_MS + miss * missMs) : NO_CDN_MS,
  };
}

export function run({ dauM, viewsPerUser, watchMin, cdnHitPct, spikeMultiplier, shieldPct, renditions }) {
  const viewsRps = ((dauM * 1e6 * viewsPerUser) / 86400) * PEAK_FACTOR;
  const spikeRps = viewsRps * spikeMultiplier;

  const naive = serve({ viewsRps, watchMin, bitrate: RAW_MBPS, hitPct: 0, copies: 1, cdn: false });
  const v1 = serve({ viewsRps, watchMin, bitrate: ABR_MBPS, hitPct: cdnHitPct, copies: renditions });
  const spiked = serve({ viewsRps: spikeRps, watchMin, bitrate: ABR_MBPS, hitPct: cdnHitPct, copies: renditions });
  const shielded = serve({
    viewsRps: spikeRps, watchMin, bitrate: ABR_MBPS, hitPct: cdnHitPct, shieldPct, shield: true, copies: renditions, tiers: 2,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Requirements, and servers that stream",
        note: `${dauM}M users watching ${viewsPerUser} videos a day is ${naive.viewsRps.toLocaleString("en-US")} views a second at peak, with ${naive.concurrentM}M streams playing at once. Streaming 1080p from your own servers is ${naive.egressTbps} Tbit/s against an origin that carries ${ORIGIN_CAP_TBPS}: ${naive.originUtilPct}% utilisation and ${naive.startupMs} ms to start. Uploads add ${naive.storageTbPerDay} TB a day.`,
        metrics: naive,
      },
      {
        beat: "component",
        title: "CDN, transcoding, adaptive bitrate",
        note: `Each upload is transcoded into ${renditions} qualities and cut into short chunks in object storage, and a CDN serves them. The player picks a quality per chunk (about ${ABR_MBPS} Mbit/s), so egress falls to ${v1.egressTbps} Tbit/s and a ${cdnHitPct}% hit rate leaves the origin ${v1.originTbps} Tbit/s (${v1.originUtilPct}%). Startup drops to ${v1.startupMs} ms. Storage grows to ${v1.storageTbPerDay} TB a day, because every quality is kept.`,
        metrics: v1,
      },
      {
        beat: "failure",
        title: `${spikeMultiplier}x traffic`,
        note: `${spikeMultiplier}x the viewers keep the same ${cdnHitPct}% hit rate, but every miss is now ${spikeMultiplier}x bigger: the origin is asked for ${spiked.originTbps} Tbit/s, ${spiked.originUtilPct}% of what it can serve. A CDN's hit rate protects the origin only in proportion to the load.`,
        metrics: spiked,
      },
      {
        beat: "tradeoff",
        title: "A shield tier in front of the origin",
        note: `Edges that miss ask a regional shield before the origin, and it absorbs ${shieldPct}% of them. The origin sees ${shielded.originTbps} Tbit/s (${shielded.originUtilPct}%), and average startup moves from ${spiked.startupMs} to ${shielded.startupMs} ms because a shield hit is nearer than the origin. The price is a second cache tier to run, size and keep consistent, and a miss that passes both tiers now pays for both hops.`,
        metrics: shielded,
      },
    ],
    summary: { originUtilPct: shielded.originUtilPct, storageTbPerDay: v1.storageTbPerDay },
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
