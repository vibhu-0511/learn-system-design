// f03 sim: what an API shape costs a mobile screen.
// Scenario: one screen shows a user, their recent posts and each post's comments.
// Assumptions: browsers run 6 requests at once over HTTP/1.1 but any number over
// HTTP/2; a resource-per-endpoint API returns whole objects while the screen needs a
// slice; bandwidth is 10 Mbit/s; a binary format is about 40% the size of JSON.
// Runs in Node (node sim.mjs --posts=25) and in the browser.

export const PARAMS = {
  posts: { label: "Posts on the screen", unit: "", min: 3, max: 50, step: 1, default: 10 },
  rttMs: { label: "Round-trip time", unit: "ms", min: 10, max: 400, step: 10, default: 50 },
  objectKb: { label: "Size of one full object", unit: "KB", min: 1, max: 20, step: 1, default: 4 },
  neededPct: { label: "Share of each object the screen uses", unit: "%", min: 5, max: 100, step: 5, default: 25 },
};

const PARALLEL = 6;
const KB_PER_MS = 1.25; // 10 Mbit/s
const SLOW_NETWORK = 6; // a poor mobile connection multiplies the round trip
const BINARY_SIZE = 0.4;
const round1 = (n) => Math.round(n * 10) / 10;

function measure(requests, roundTrips, payloadKb, rttMs) {
  return {
    requests,
    roundTrips,
    payloadKb: round1(payloadKb),
    loadMs: round1(roundTrips * rttMs + payloadKb / KB_PER_MS),
  };
}

export function run({ posts, rttMs, objectKb, neededPct }) {
  const objects = posts + 2; // the user, the post list, and one comment list per post
  const restWaves = 1 + Math.ceil(posts / PARALLEL); // user and posts first, then the comments
  const rest = measure(objects, restWaves, objects * objectKb, rttMs);
  const shaped = measure(1, 1, (objects * objectKb * neededPct) / 100, rttMs);
  const restSlow = measure(objects, restWaves, objects * objectKb, rttMs * SLOW_NETWORK);
  const grpc = measure(objects, 2, objects * objectKb * BINARY_SIZE, rttMs); // HTTP/2 lifts the 6-request limit

  return {
    frames: [
      {
        beat: "constraints",
        title: "REST: one endpoint per resource",
        note: `The screen needs ${objects} objects, so the client makes ${rest.requests} requests in ${rest.roundTrips} waves and downloads ${rest.payloadKb} KB, of which it uses ${neededPct}%. ${rest.loadMs} ms.`,
        metrics: rest,
      },
      {
        beat: "component",
        title: "One call shaped for the screen",
        note: `A GraphQL query or a backend-for-frontend endpoint returns just what the screen needs in one round trip: ${shaped.payloadKb} KB, ${shaped.loadMs} ms.`,
        metrics: shaped,
      },
      {
        beat: "failure",
        title: "The same REST screen on a slow network",
        note: `Each round trip now costs ${rttMs * SLOW_NETWORK} ms. Chatty APIs pay for every wave: ${restSlow.loadMs} ms.`,
        metrics: restSlow,
      },
      {
        beat: "tradeoff",
        title: "gRPC: binary and multiplexed",
        note: `Typed, compact messages over HTTP/2 need ${grpc.roundTrips} round trips and ${grpc.payloadKb} KB: ${grpc.loadMs} ms. But browsers cannot call gRPC directly, so web clients need a translating proxy.`,
        metrics: grpc,
      },
    ],
    summary: { restMs: rest.loadMs, shapedMs: shaped.loadMs },
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
