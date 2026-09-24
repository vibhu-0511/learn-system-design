// c05 sim: Instagram Stories, an end-to-end capacity and bottleneck run.
// Assumptions: numbers come from the vault note (500M daily users, 60% upload, 2.5 stories each,
// peak = 5x the daily average, 10.2 MB stored per story across all renditions, 50 story views per
// user a day, S3 Standard at $23 per TB-month, 150 followers, celebrities skip fan-out above 1M
// followers and cost 50 ms extra to read). Assumed by this sim: a user follows 300 accounts and one
// Cassandra read takes 7 ms (the note says 300 queries take "2+ seconds"), a Redis feed read takes
// 20 ms, a naive design keeps stories 30 days, and celebPct of uploads come from 1M-follower accounts.
// Runs in Node (node sim.mjs --growth=10) and in the browser.

export const PARAMS = {
  dauM: { label: "Daily active users", unit: "M", min: 50, max: 1000, step: 50, default: 500 },
  uploaderPct: { label: "Users who upload a story", unit: "%", min: 10, max: 100, step: 5, default: 60 },
  storiesPer: { label: "Stories per uploader per day", unit: "", min: 1, max: 5, step: 0.5, default: 2.5 },
  followers: { label: "Average followers", unit: "", min: 20, max: 500, step: 10, default: 150 },
  growth: { label: "Growth", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  celebPct: { label: "Uploads from 1M-follower accounts", unit: "%", min: 0, max: 1, step: 0.05, default: 0.1 },
};

const PEAK = 5;
const STORY_MB = 10.2;
const VIEWS_PER_USER = 50;
const USD_PER_TB = 23;
const CELEB_FOLLOWERS = 1000000;
const FOLLOWING = 300;
const CASSANDRA_MS = 7;
const REDIS_MS = 20;
const CELEB_EXTRA_MS = 50;
const NAIVE_RETENTION_DAYS = 30;
const round1 = (n) => Math.round(n * 10) / 10;
const fmt = (n) => Math.round(n).toLocaleString("en-US");

function outcome({ peakUpload, peakView, storagePb, feedWrites, readMs, deleteRps }) {
  return {
    peakUploadRps: Math.round(peakUpload),
    peakViewRps: Math.round(peakView),
    storagePb: round1(storagePb),
    storageCostK: Math.round(storagePb * 1000 * USD_PER_TB / 1000),
    feedWriteRps: Math.round(feedWrites),
    feedReadMs: readMs,
    deleteRps: Math.round(deleteRps),
  };
}

export function run({ dauM, uploaderPct, storiesPer, followers, growth, celebPct }) {
  const dau = dauM * 1e6;
  const perDay = dau * (uploaderPct / 100) * storiesPer;
  const peakUpload = (perDay / 86400) * PEAK;
  const peakView = ((dau * VIEWS_PER_USER) / 86400) * PEAK;
  const dayPb = (perDay * STORY_MB) / 1e9;
  const celeb = celebPct / 100;

  const naive = outcome({
    peakUpload, peakView, storagePb: dayPb * NAIVE_RETENTION_DAYS,
    feedWrites: 0, readMs: FOLLOWING * CASSANDRA_MS, deleteRps: perDay / 86400,
  });
  const v1 = outcome({
    peakUpload, peakView, storagePb: dayPb,
    feedWrites: peakUpload * followers, readMs: REDIS_MS, deleteRps: 0,
  });
  const meanFanout = (1 - celeb) * followers + celeb * CELEB_FOLLOWERS;
  const grown = outcome({
    peakUpload: peakUpload * growth, peakView: peakView * growth, storagePb: dayPb * growth,
    feedWrites: peakUpload * growth * meanFanout, readMs: REDIS_MS, deleteRps: 0,
  });
  const hybrid = outcome({
    peakUpload: peakUpload * growth, peakView: peakView * growth, storagePb: dayPb * growth,
    feedWrites: peakUpload * growth * (1 - celeb) * followers, readMs: REDIS_MS + CELEB_EXTRA_MS, deleteRps: 0,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Stories built like posts",
        note: `${dauM}M daily users upload ${fmt(perDay / 1e6)}M stories a day, ${fmt(naive.peakUploadRps)} a second at peak, and watch ${fmt(naive.peakViewRps)} a second. Kept 30 days like posts, that is ${naive.storagePb} PB costing $${fmt(naive.storageCostK)}K a month; a delete job must remove ${fmt(naive.deleteRps)} rows a second; a feed built by asking ${FOLLOWING} accounts takes ${fmt(naive.feedReadMs)} ms.`,
        metrics: naive,
      },
      {
        beat: "component",
        title: "TTL everywhere, fan-out on write",
        note: `Every layer expires content by itself, so storage stays at one day: ${v1.storagePb} PB, $${fmt(v1.storageCostK)}K a month, no delete job. An upload writes its id into each of ${followers} follower feeds: ${fmt(v1.feedWriteRps)} feed writes a second at peak, and opening the tray takes ${v1.feedReadMs} ms.`,
        metrics: v1,
      },
      {
        beat: "failure",
        title: `${growth}x growth with a few celebrities`,
        note: `At ${growth}x, storage is ${grown.storagePb} PB and uploads reach ${fmt(grown.peakUploadRps)} a second. But ${celebPct}% of uploads come from accounts with 1M followers, which lifts the average fan-out from ${followers} to ${fmt(meanFanout)} writes per story: ${fmt(grown.feedWriteRps)} feed writes a second.`,
        metrics: grown,
      },
      {
        beat: "tradeoff",
        title: "Hybrid: pull celebrities at read time",
        note: `Celebrity stories skip fan-out and are merged in when a feed opens, so writes fall to ${fmt(hybrid.feedWriteRps)} a second, a ${round1(grown.feedWriteRps / hybrid.feedWriteRps)}x cut. Every feed read now pays about ${CELEB_EXTRA_MS} ms extra (${hybrid.feedReadMs} ms in total).`,
        metrics: hybrid,
      },
    ],
    summary: { peakUploadRps: v1.peakUploadRps, storagePb: v1.storagePb, feedWriteRps: hybrid.feedWriteRps },
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
