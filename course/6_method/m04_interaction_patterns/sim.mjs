// m04 sim: a synchronous call chain against one that keeps only the calls the caller needs.
// Assumptions: every hop takes `hopMs` and is up `hopAvailPct` of the time, failures are independent,
// so end-to-end availability is the product of the hops and latency is their sum. One hop in the
// chain can be slow (`slowMs`). In the async design only `syncHops` calls stay on the request path,
// the rest run behind a queue that adds a 5 ms publish and is treated as 99.99% available; the
// skipped work still finishes, later (the lag). A 30-day month is 43,200 minutes.
// Runs in Node (node sim.mjs --hops=8) and in the browser.

export const PARAMS = {
  hops: { label: "Services in the chain", unit: "", min: 2, max: 10, step: 1, default: 5 },
  hopMs: { label: "Time per hop", unit: "ms", min: 5, max: 200, step: 5, default: 50 },
  hopAvailPct: { label: "Availability per hop", unit: "%", min: 90, max: 99.99, step: 0.01, default: 99.9 },
  slowMs: { label: "One hop is slow", unit: "ms", min: 100, max: 2000, step: 50, default: 500 },
  syncHops: { label: "Hops the caller truly needs", unit: "", min: 1, max: 10, step: 1, default: 2 },
};

const PUBLISH_MS = 5;
const QUEUE_AVAIL_PCT = 99.99;
const MONTH_MIN = 43200;
const r2 = (n) => Math.round(n * 100) / 100;

export function run(params) {
  const { hops, hopMs, hopAvailPct, slowMs, syncHops } = params;
  const a = hopAvailPct / 100;
  const need = Math.min(syncHops, hops);
  const availPct = (n) => a ** n * 100;
  const metrics = (latencyMs, availability, sync, lagMs) => ({
    latencyMs: Math.round(latencyMs),
    availabilityPct: r2(availability),
    downtimeMinPerMonth: r2(((100 - availability) / 100) * MONTH_MIN),
    syncHops: sync,
    asyncLagMs: Math.round(lagMs),
  });

  const chain = metrics(hops * hopMs, availPct(hops), hops, 0);
  const slow = metrics((hops - 1) * hopMs + slowMs, availPct(hops), hops, 0);
  const asyncAvail = availPct(need) * (QUEUE_AVAIL_PCT / 100);
  const split = metrics(need * hopMs + PUBLISH_MS, asyncAvail, need, (hops - need) * hopMs);

  return {
    frames: [
      {
        beat: "constraints",
        title: `${hops} services in a row, each ${hopMs} ms and ${hopAvailPct}% available`,
        note: `Client to A to B to ... ${hops} hops. Each hop is a promise. Latency adds up across the chain, and availability multiplies.`,
        metrics: metrics(0, 0, 0, 0),
      },
      {
        beat: "component",
        title: `Synchronous chain: ${chain.latencyMs} ms and ${chain.availabilityPct}%`,
        note: `${hops} x ${hopMs} ms = ${chain.latencyMs} ms minimum. ${hopAvailPct}% to the power ${hops} is ${chain.availabilityPct}%, about ${chain.downtimeMinPerMonth} minutes of downtime a month, more than any single service shows.`,
        metrics: chain,
      },
      {
        beat: "failure",
        title: `One hop slows to ${slowMs} ms and the whole chain follows`,
        note: `The other ${hops - 1} hops are healthy, but the request now takes ${slow.latencyMs} ms. The caller is blocked the whole time, and if that hop is down, every request that reaches it fails.`,
        metrics: slow,
      },
      {
        beat: "tradeoff",
        title: `Keep ${need} calls synchronous, put the other ${hops - need} behind a queue`,
        note: `The caller waits for ${need} hop${need === 1 ? "" : "s"} and a ${PUBLISH_MS} ms publish: ${split.latencyMs} ms at ${split.availabilityPct}% availability. The price: the other work finishes about ${split.asyncLagMs} ms later, you need idempotent consumers and a dead-letter queue, and the flow is harder to debug.`,
        metrics: split,
      },
    ],
    summary: { chainMs: chain.latencyMs, asyncMs: split.latencyMs },
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
