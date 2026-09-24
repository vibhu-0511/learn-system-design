// c08 sim: Zoom, an end-to-end capacity and bottleneck run for one meeting size, then the fleet.
// Assumptions: numbers come from the vault note (28.1M peak concurrent participants, 5 Mbit/s
// upload per person with simulcast, 1.5 Mbit/s per received stream, a 10 Gbit/s NIC per SFU server,
// 30% spare servers, $0.77 an hour per server over 730 hours, SFU latency about 100 ms). Assumed by
// this sim: in a peer-to-peer mesh each person sends and receives full 5 Mbit/s streams and latency
// is 50 ms; the SFU fleet counts only media servers; when one meeting is bigger than a NIC its
// servers are split, so participants per server can be a fraction; gallery view shows `tiles` streams.
// Runs in Node (node sim.mjs --growth=10) and in the browser.

export const PARAMS = {
  meetingSize: { label: "People in a meeting", unit: "", min: 2, max: 50, step: 1, default: 10 },
  growth: { label: "Meeting size growth", unit: "x", min: 1, max: 20, step: 1, default: 10 },
  peakUsersM: { label: "Peak concurrent participants", unit: "M", min: 1, max: 100, step: 1, default: 28.1 },
  uploadMbps: { label: "Upload per person", unit: "Mbps", min: 1, max: 10, step: 0.5, default: 5 },
  tiles: { label: "Video tiles a person receives", unit: "", min: 1, max: 49, step: 1, default: 9 },
};

const RECEIVE_MBPS = 1.5;
const NIC_MBPS = 10000;
const SPARE = 1.3;
const USD_PER_SERVER = 0.77 * 730;
const MESH_MS = 50;
const SFU_MS = 100;
const round1 = (n) => Math.round(n * 10) / 10;
const fmt = (n) => Math.round(n).toLocaleString("en-US");

function mesh(n, up) {
  return { clientUpMbps: round1((n - 1) * up), clientDownMbps: round1((n - 1) * up), meetingMbps: 0, participantsPerServer: 0, servers: 0, monthlyCostM: 0, latencyMs: MESH_MS };
}

function sfu(n, up, streams, peakUsers) {
  const down = streams * RECEIVE_MBPS;
  const meetingMbps = n * up + n * down;
  const perServer = (NIC_MBPS / meetingMbps) * n;
  const servers = Math.ceil((peakUsers / perServer) * SPARE);
  return {
    clientUpMbps: up, clientDownMbps: round1(down), meetingMbps: round1(meetingMbps),
    participantsPerServer: round1(perServer), servers,
    monthlyCostM: round1((servers * USD_PER_SERVER) / 1e6), latencyMs: SFU_MS,
  };
}

export function run({ meetingSize, growth, peakUsersM, uploadMbps, tiles }) {
  const peakUsers = peakUsersM * 1e6;
  const big = meetingSize * growth;

  const p2p = mesh(meetingSize, uploadMbps);
  const base = sfu(meetingSize, uploadMbps, meetingSize - 1, peakUsers);
  const grown = sfu(big, uploadMbps, big - 1, peakUsers);
  const shown = Math.min(big - 1, tiles);
  const gallery = sfu(big, uploadMbps, shown, peakUsers);

  return {
    frames: [
      {
        beat: "constraints",
        title: "Peer-to-peer mesh",
        note: `${peakUsersM}M people are in calls at peak and must hear each other within 150 ms. In a ${meetingSize}-person mesh each one uploads ${p2p.clientUpMbps} Mbit/s (${meetingSize - 1} copies of a ${uploadMbps} Mbit/s stream), which no home link gives you, and the whole call grows with the square of its size.`,
        metrics: p2p,
      },
      {
        beat: "component",
        title: "Selective forwarding unit (SFU)",
        note: `Each person uploads once (${uploadMbps} Mbit/s) and the SFU forwards ${meetingSize - 1} streams of ${RECEIVE_MBPS} Mbit/s to each: ${base.meetingMbps} Mbit/s per meeting, ${base.participantsPerServer} people per 10 Gbit/s server, ${fmt(base.servers)} servers with spare capacity, about $${base.monthlyCostM}M a month.`,
        metrics: base,
      },
      {
        beat: "failure",
        title: `${big}-person meetings`,
        note: `An SFU sends ${big - 1} streams to each of ${big} people, so per-person download is ${grown.clientDownMbps} Mbit/s and one meeting needs ${fmt(grown.meetingMbps)} Mbit/s. A server now holds ${grown.participantsPerServer} people, the fleet needs ${fmt(grown.servers)} servers ($${fmt(grown.monthlyCostM)}M a month). The fleet is ${round1(grown.servers / base.servers)}x the baseline: every person costs that much more, because streams grow with the square of meeting size.`,
        metrics: grown,
      },
      {
        beat: "tradeoff",
        title: `Gallery view shows only ${tiles} people`,
        note: `Each client is sent at most ${tiles} streams, so per-person download is ${gallery.clientDownMbps} Mbit/s and the fleet falls to ${fmt(gallery.servers)} servers ($${fmt(gallery.monthlyCostM)}M a month). In a ${big}-person meeting ${fmt(Math.max(0, big - 1 - shown))} people are not on screen.`,
        metrics: gallery,
      },
    ],
    summary: { baseServers: base.servers, grownServers: grown.servers, galleryServers: gallery.servers },
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
