// b08 sim: one screen of a mobile app that needs data from several microservices.
// Assumptions: the vault note's 15 microservices; the phone opens at most `parallel`
// requests at once; each service checks auth on its own for 10 ms (the gateway checks once);
// a call inside the data centre costs a 2 ms round trip; each service is `svcAvailPct`
// available and a screen needs all of the services it calls; the gateway is one process with
// availability `gatewayAvailPct`, and the "replicated" frame runs two independent copies.
// Runs in Node (node sim.mjs --calls=12) and in the browser.

export const PARAMS = {
  calls: { label: "Services one screen needs", unit: "", min: 1, max: 15, step: 1, default: 8 },
  mobileRttMs: { label: "Phone round trip", unit: "ms", min: 10, max: 400, step: 10, default: 80 },
  parallel: { label: "Parallel requests on the phone", unit: "", min: 1, max: 6, step: 1, default: 4 },
  serviceMs: { label: "Service work per call", unit: "ms", min: 5, max: 200, step: 5, default: 30 },
  gatewayHopMs: { label: "Gateway hop", unit: "ms", min: 1, max: 50, step: 1, default: 5 },
  svcAvailPct: { label: "Each service available", unit: "%", min: 99, max: 99.99, step: 0.01, default: 99.9 },
  gatewayAvailPct: { label: "Gateway available", unit: "%", min: 99, max: 99.99, step: 0.01, default: 99.95 },
};

const AUTH_MS = 10;
const INTERNAL_RTT_MS = 2;
const TOTAL_SERVICES = 15;
const MINUTES_PER_MONTH = 43200;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ latencyMs, clientCalls, authChecks, availability, blastPct }) {
  return {
    screenLatencyMs: Math.round(latencyMs),
    clientCalls,
    authChecks,
    availabilityPct: Math.round(availability * 10000) / 100,
    monthlyDownMin: round1((1 - availability) * MINUTES_PER_MONTH),
    blastRadiusPct: round1(blastPct),
  };
}

export function run({ calls, mobileRttMs, parallel, serviceMs, gatewayHopMs, svcAvailPct, gatewayAvailPct }) {
  const services = (svcAvailPct / 100) ** calls;
  const gateway = gatewayAvailPct / 100;

  const rounds = Math.ceil(calls / parallel);
  const direct = outcome({
    latencyMs: rounds * (mobileRttMs + AUTH_MS + serviceMs),
    clientCalls: calls,
    authChecks: calls,
    availability: services,
    blastPct: 100 / TOTAL_SERVICES,
  });

  const composedMs = mobileRttMs + gatewayHopMs + AUTH_MS + INTERNAL_RTT_MS + serviceMs;
  const composed = outcome({ latencyMs: composedMs, clientCalls: 1, authChecks: 1, availability: services, blastPct: 100 / TOTAL_SERVICES });

  const single = outcome({ latencyMs: composedMs, clientCalls: 1, authChecks: 1, availability: gateway * services, blastPct: 100 });

  const replicas = outcome({
    latencyMs: composedMs,
    clientCalls: 1,
    authChecks: 1,
    availability: (1 - (1 - gateway) ** 2) * services,
    blastPct: 0,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: `${calls} direct calls from the phone`,
        note: `The screen makes ${direct.clientCalls} calls in ${rounds} round${rounds > 1 ? "s" : ""} of up to ${parallel}, each paying a ${mobileRttMs} ms phone round trip and its own auth check (${direct.authChecks} in all). The screen takes ${direct.screenLatencyMs} ms, and moving one service breaks the app.`,
        metrics: direct,
      },
      {
        beat: "component",
        title: "One composed call through a gateway",
        note: `The gateway takes one call, checks auth once, and fans out inside the data centre where a round trip costs ${INTERNAL_RTT_MS} ms. The screen takes ${composed.screenLatencyMs} ms with ${composed.clientCalls} call and ${composed.authChecks} auth check.`,
        metrics: composed,
      },
      {
        beat: "failure",
        title: "The gateway is a single point of failure",
        note: `Every screen now needs the gateway. It adds ${round1((1 - gateway) * MINUTES_PER_MONTH)} down minutes a month on top of the services' ${composed.monthlyDownMin}, and one gateway failure hits ${single.blastRadiusPct}% of screens instead of ${direct.blastRadiusPct}%.`,
        metrics: single,
      },
      {
        beat: "tradeoff",
        title: "Two gateway copies, one more hop to own",
        note: `Two copies mean losing one hits ${replicas.blastRadiusPct}% of screens and monthly downtime falls to ${replicas.monthlyDownMin} min. You keep paying the ${gatewayHopMs} ms hop on every request, and a bad gateway deploy still hits all copies at once.`,
        metrics: replicas,
      },
    ],
    summary: { directMs: direct.screenLatencyMs, composedMs: composed.screenLatencyMs },
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
