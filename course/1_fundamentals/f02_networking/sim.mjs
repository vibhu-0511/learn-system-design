// f02 sim: how many network round trips it takes to load a page.
// Assumptions: a browser opens up to 6 connections for HTTP/1.x; TLS 1.2 adds 2 round
// trips; every resource is about 10 packets; a lost packet stalls its connection for one
// round trip; an HTTP/3 client that finds UDP blocked wastes 300 ms before falling back.
// Runs in Node (node sim.mjs --rttMs=150) and in the browser.

export const PARAMS = {
  resources: { label: "Resources on the page", unit: "", min: 5, max: 100, step: 5, default: 30 },
  rttMs: { label: "Round-trip time", unit: "ms", min: 10, max: 300, step: 10, default: 50 },
  lossPct: { label: "Packet loss", unit: "%", min: 0, max: 10, step: 0.5, default: 2 },
  udpBlockedPct: { label: "Networks that block UDP", unit: "%", min: 0, max: 30, step: 1, default: 5 },
};

const PARALLEL = 6; // connections a browser opens per host for HTTP/1.x
const TCP_SETUP = 1;
const TLS_SETUP = 2;
const PACKETS_PER_RESOURCE = 10;
const QUIC_SETUP = 1; // transport and encryption handshake together
const FALLBACK_MS = 300;
const round1 = (n) => Math.round(n * 10) / 10;

function result(roundTrips, stallRtts, rttMs, worstCaseMs) {
  const stallMs = stallRtts * rttMs;
  const pageLoadMs = roundTrips * rttMs + stallMs;
  return {
    roundTrips: round1(roundTrips + stallRtts),
    stallMs: round1(stallMs),
    pageLoadMs: round1(pageLoadMs),
    worstCaseMs: round1(worstCaseMs ?? pageLoadMs),
  };
}

export function run({ resources, rttMs, lossPct, udpBlockedPct }) {
  const loss = lossPct / 100;
  // HTTP/1.0: every resource opens a new connection, six at a time: setup, then the request.
  const waves = Math.ceil(resources / PARALLEL);
  const http1 = result(waves * (TCP_SETUP + TLS_SETUP + 1), 0, rttMs);
  // HTTP/2: one connection, every request multiplexed on it.
  const http2Clean = result(TCP_SETUP + TLS_SETUP + 1, 0, rttMs);
  // Over TCP one lost packet blocks every stream on the connection.
  const http2Lossy = result(TCP_SETUP + TLS_SETUP + 1, loss * resources * PACKETS_PER_RESOURCE, rttMs);
  // HTTP/3: one round trip to set up, and a lost packet only stalls its own stream.
  const http3 = result(QUIC_SETUP + 1, loss * PACKETS_PER_RESOURCE, rttMs, FALLBACK_MS + http2Lossy.pageLoadMs);

  return {
    frames: [
      {
        beat: "constraints",
        title: "HTTP/1.0: a new connection per request",
        note: `${resources} resources, six connections at a time, each paying a TCP and TLS handshake first: ${http1.roundTrips} round trips, ${http1.pageLoadMs} ms at ${rttMs} ms each.`,
        metrics: http1,
      },
      {
        beat: "component",
        title: "HTTP/2: one connection, multiplexed",
        note: `Set up once, then send all ${resources} requests together: ${http2Clean.roundTrips} round trips, ${http2Clean.pageLoadMs} ms.`,
        metrics: http2Clean,
      },
      {
        beat: "failure",
        title: `${lossPct}% packet loss over TCP`,
        note: `A lost packet stalls every stream on the one connection. Expect ${round1(loss * resources * PACKETS_PER_RESOURCE)} stalls, adding ${http2Lossy.stallMs} ms: ${http2Lossy.pageLoadMs} ms in total.`,
        metrics: http2Lossy,
      },
      {
        beat: "tradeoff",
        title: "HTTP/3 over QUIC",
        note: `One round trip to set up and loss only stalls one stream: ${http3.pageLoadMs} ms. But ${udpBlockedPct}% of networks block UDP; those users wait ${FALLBACK_MS} ms and then fall back, ${http3.worstCaseMs} ms in the worst case.`,
        metrics: http3,
      },
    ],
    summary: { http1Ms: http1.pageLoadMs, http2Ms: http2Clean.pageLoadMs, http3Ms: http3.pageLoadMs },
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
