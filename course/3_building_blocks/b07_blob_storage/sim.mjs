// b07 sim: where user-uploaded files should live.
// Assumptions: a database backup runs at about 83 GB an hour (the vault note's 500 GB in
// 6 hours); a database keeps a file as a row (assumed $0.115 per GB-month, the price of
// fast disk) and each image's metadata takes 1 KB; object storage costs $0.023 per GB-month
// for Standard and $0.004 for Glacier Instant Retrieval (vault note prices); one app server
// has a 1 Gbit/s network link; and cold data comes back in minutes.
// Runs in Node (node sim.mjs --images=5000000) and in the browser.

export const PARAMS = {
  images: { label: "Stored images", unit: "", min: 100000, max: 50000000, step: 100000, default: 1000000 },
  imageMb: { label: "Average image size", unit: "MB", min: 0.1, max: 5, step: 0.1, default: 0.5 },
  uploadsPerSec: { label: "Uploads", unit: "per s", min: 1, max: 500, step: 1, default: 50 },
  spikeMultiplier: { label: "Upload spike", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  coldPct: { label: "Images nobody opens any more", unit: "%", min: 0, max: 95, step: 5, default: 80 },
};

const BACKUP_GB_PER_HOUR = 83;
const DB_COST_GB = 0.115;
const STANDARD_COST_GB = 0.023;
const COLD_COST_GB = 0.004;
const METADATA_KB = 1;
const SERVER_MBPS = 1000;
const COLD_RETRIEVAL_MIN = 5;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ dbGb, storedGb, appMbps, coldGb = 0 }, cost) {
  return {
    dbSizeGb: round1(dbGb),
    backupHours: round1(dbGb / BACKUP_GB_PER_HOUR),
    appServerMbps: Math.round(appMbps),
    storageCostUsd: Math.round(cost),
    coldRetrievalMin: coldGb > 0 ? COLD_RETRIEVAL_MIN : 0,
  };
}

export function run({ images, imageMb, uploadsPerSec, spikeMultiplier, coldPct }) {
  const totalGb = (images * imageMb) / 1000;
  const metadataGb = (images * METADATA_KB) / 1e6;
  const uploadMbps = uploadsPerSec * imageMb * 8;

  const inDb = outcome({ dbGb: totalGb, appMbps: uploadMbps }, totalGb * DB_COST_GB);
  const objectStore = outcome({ dbGb: metadataGb, appMbps: uploadMbps }, totalGb * STANDARD_COST_GB + metadataGb * DB_COST_GB);

  const spikeMbps = uploadMbps * spikeMultiplier;
  const spiked = outcome({ dbGb: metadataGb, appMbps: spikeMbps }, totalGb * STANDARD_COST_GB + metadataGb * DB_COST_GB);

  const coldGb = totalGb * (coldPct / 100);
  const tiered = outcome(
    { dbGb: metadataGb, appMbps: 0, coldGb },
    (totalGb - coldGb) * STANDARD_COST_GB + coldGb * COLD_COST_GB + metadataGb * DB_COST_GB,
  );

  return {
    frames: [
      {
        beat: "constraints",
        title: "Images as BLOBs in the database",
        note: `${images.toLocaleString("en-US")} images make a ${inDb.dbSizeGb} GB database. Backups take ${inDb.backupHours} hours, queries slow down, and you pay database prices ($${inDb.storageCostUsd} a month) for files that need no joins or transactions.`,
        metrics: inDb,
      },
      {
        beat: "component",
        title: "Object storage, URL in the database",
        note: `The files move to object storage; the database keeps only a key (${objectStore.dbSizeGb} GB, ${objectStore.backupHours} hours to back up). Storage costs $${objectStore.storageCostUsd} a month with 11 nines of durability.`,
        metrics: objectStore,
      },
      {
        beat: "failure",
        title: `Uploads spike ${spikeMultiplier}x through your servers`,
        note: `Every byte still flows through the app: ${spiked.appServerMbps} Mbit/s, which needs ${Math.ceil(spiked.appServerMbps / SERVER_MBPS)} servers' network links just to carry uploads.`,
        metrics: spiked,
      },
      {
        beat: "tradeoff",
        title: "Presigned URLs and a cold tier",
        note: `Clients upload straight to storage with a time-limited URL, so the app carries ${tiered.appServerMbps} Mbit/s. Moving the ${coldPct}% of images nobody opens to an archive tier cuts the bill to $${tiered.storageCostUsd} a month, but reading one takes about ${tiered.coldRetrievalMin} minutes and adds a retrieval fee.`,
        metrics: tiered,
      },
    ],
    summary: { dbGb: inDb.dbSizeGb, objectStoreCostUsd: objectStore.storageCostUsd },
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
