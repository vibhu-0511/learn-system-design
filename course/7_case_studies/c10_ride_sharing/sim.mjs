// c10 sim: a ride-sharing service's location firehose, from requirements to a 10x city.
// Assumptions: the vault note gives 2M active drivers sending a 200-byte position every 3 s, 10M
// rides a day, and a geohash search that reads 9 cells. Everything else is assumed: one store node
// takes 100,000 writes a second and is kept under 70% busy, a driver moves 11 m/s (40 km/h), a
// geohash cell holds 40 drivers, and the busiest region gets 25% of all updates once the city grows.
// Runs in Node (node sim.mjs --drivers=4) and in the browser.

export const PARAMS = {
  drivers: { label: "Active drivers", unit: "M", min: 0.5, max: 10, step: 0.5, default: 2 },
  updateSec: { label: "Seconds between location updates", unit: "s", min: 1, max: 10, step: 1, default: 3 },
  ridesPerDayM: { label: "Rides per day", unit: "M", min: 1, max: 50, step: 1, default: 10 },
  spikeMultiplier: { label: "Growth or event spike", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  hotSharePct: { label: "Updates landing in the busiest region", unit: "%", min: 5, max: 60, step: 5, default: 25 },
  slowUpdateSec: { label: "Trade-off: seconds between updates", unit: "s", min: 1, max: 15, step: 1, default: 5 },
  driversPerCell: { label: "Drivers per geohash cell", unit: "", min: 5, max: 200, step: 5, default: 40 },
};

const NODE_WRITES_RPS = 100000;
const TARGET_UTIL = 0.7;
const PAYLOAD_BYTES = 200;
const CELLS_READ = 9;
const DRIVER_MPS = 11;

const utilPct = (rps) => Math.round((rps / NODE_WRITES_RPS) * 100);
const nodesFor = (rps) => Math.ceil(rps / (NODE_WRITES_RPS * TARGET_UTIL));

function state({ updatesRps, matchRps, shards, hotRps, candidates, updateSec }) {
  return {
    updatesRps: Math.round(updatesRps),
    matchRps: Math.round(matchRps),
    bandwidthMbps: Math.round((updatesRps * PAYLOAD_BYTES * 8) / 1e6),
    shards,
    hotShardUtilPct: utilPct(hotRps),
    candidatesPerMatch: candidates,
    staleMeters: updateSec * DRIVER_MPS,
  };
}

export function run({ drivers, updateSec, ridesPerDayM, spikeMultiplier, hotSharePct, slowUpdateSec, driversPerCell }) {
  const updatesRps = (drivers * 1e6) / updateSec;
  const matchRps = (ridesPerDayM * 1e6) / 86400;
  const perCell = CELLS_READ * driversPerCell;

  const single = state({ updatesRps, matchRps, shards: 1, hotRps: updatesRps, candidates: drivers * 1e6, updateSec });

  const shards = nodesFor(updatesRps);
  const v1 = state({ updatesRps, matchRps, shards, hotRps: updatesRps / shards, candidates: perCell, updateSec });

  const bigUpdates = updatesRps * spikeMultiplier;
  const hotShare = hotSharePct / 100;
  const spiked = state({
    updatesRps: bigUpdates, matchRps: matchRps * spikeMultiplier, shards,
    hotRps: bigUpdates * Math.max(hotShare, 1 / shards), candidates: perCell * spikeMultiplier, updateSec,
  });

  const slowUpdates = (drivers * 1e6 * spikeMultiplier) / slowUpdateSec;
  const hotShards = nodesFor(slowUpdates * hotShare);
  const otherShards = nodesFor(slowUpdates * (1 - hotShare));
  const split = state({
    updatesRps: slowUpdates, matchRps: matchRps * spikeMultiplier, shards: hotShards + otherShards,
    hotRps: (slowUpdates * hotShare) / hotShards, candidates: perCell * spikeMultiplier, updateSec: slowUpdateSec,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: "Requirements, and one location store",
        note: `${drivers}M drivers reporting every ${updateSec} s is ${single.updatesRps.toLocaleString("en-US")} writes a second, while ${ridesPerDayM}M rides a day is only ${single.matchRps} match requests a second. The location stream is the heavy load, ${single.bandwidthMbps} Mbit/s of it. One store node, with no index, scans ${single.candidatesPerMatch.toLocaleString("en-US")} drivers per match and runs at ${single.hotShardUtilPct}% of its write capacity.`,
        metrics: single,
      },
      {
        beat: "component",
        title: "Geohash cells, sharded by region",
        note: `Positions are keyed by geohash and spread over ${v1.shards} shards, each about ${v1.hotShardUtilPct}% busy. A match reads the rider's cell and its 8 neighbours, which is about ${v1.candidatesPerMatch} drivers to rank instead of ${single.candidatesPerMatch.toLocaleString("en-US")}. The design quietly assumes updates spread evenly over the shards.`,
        metrics: v1,
      },
      {
        beat: "failure",
        title: `${spikeMultiplier}x the drivers, and a hot region`,
        note: `${spikeMultiplier}x the updates is ${spiked.updatesRps.toLocaleString("en-US")} a second on the same ${shards} shards, and ${hotSharePct}% of them land in one busy region. That shard is asked for ${spiked.hotShardUtilPct}% of what it can write. Location writes do not shard evenly, because drivers cluster where riders are.`,
        metrics: spiked,
      },
      {
        beat: "tradeoff",
        title: "Split the hot cell and update less often",
        note: `Drivers report every ${slowUpdateSec} s instead of ${updateSec}, and the hot region is split over ${hotShards} shards (${split.shards} in all). The busiest shard is back to ${split.hotShardUtilPct}%. The price is stale positions: a driver moves ${split.staleMeters} m between updates instead of ${single.staleMeters} m, so ETAs and matches are less accurate.`,
        metrics: split,
      },
    ],
    summary: { shards: split.shards, hotShardUtilPct: split.hotShardUtilPct },
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
