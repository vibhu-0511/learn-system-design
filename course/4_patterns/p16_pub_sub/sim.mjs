// p16 sim: one service announcing an event to several others, directly or through a broker.
// Assumptions: the publisher makes calls one after another, each taking `callMs`; a broker takes
// 5 ms to store and acknowledge an event and then delivers to all subscribers in parallel; one
// subscriber processes only `slowSubscriberRps` events a second while events arrive at
// `eventsPerSec`, and its backlog is measured after `backlogMin` minutes; a consumer group of
// `consumers` copies shares that subscriber's work; the broker delivers at least once, so
// `redeliveryPct` of deliveries arrive twice.
// Runs in Node (node sim.mjs --subscribers=50) and in the browser.

export const PARAMS = {
  eventsPerSec: { label: "Events", unit: "per s", min: 10, max: 1000, step: 10, default: 100 },
  subscribers: { label: "Subscribers", unit: "", min: 1, max: 100, step: 1, default: 10 },
  callMs: { label: "One call", unit: "ms", min: 5, max: 200, step: 5, default: 30 },
  slowSubscriberRps: { label: "Slow subscriber's capacity", unit: "per s", min: 10, max: 500, step: 10, default: 40 },
  backlogMin: { label: "Minutes of slowness", unit: "min", min: 1, max: 60, step: 1, default: 10 },
  consumers: { label: "Consumers in the group", unit: "", min: 1, max: 10, step: 1, default: 3 },
  redeliveryPct: { label: "Deliveries repeated", unit: "%", min: 0, max: 10, step: 0.5, default: 2 },
};

const BROKER_MS = 5;

function outcome({ waitMs, endToEndMs, deliveries, backlog = 0, duplicates = 0 }) {
  return {
    publisherWaitMs: Math.round(waitMs),
    endToEndMs: Math.round(endToEndMs),
    deliveriesRps: Math.round(deliveries),
    slowSubscriberBacklog: Math.max(0, Math.round(backlog)),
    duplicatesPerMin: Math.round(duplicates),
  };
}

export function run({ eventsPerSec, subscribers, callMs, slowSubscriberRps, backlogMin, consumers, redeliveryPct }) {
  const deliveries = eventsPerSec * subscribers;
  const backlog = (eventsPerSec - slowSubscriberRps) * backlogMin * 60;
  const groupBacklog = (eventsPerSec - slowSubscriberRps * consumers) * backlogMin * 60;
  const duplicates = deliveries * (redeliveryPct / 100) * 60;

  const direct = outcome({ waitMs: subscribers * callMs, endToEndMs: subscribers * callMs, deliveries });
  const broker = outcome({ waitMs: callMs + BROKER_MS, endToEndMs: callMs + BROKER_MS + callMs, deliveries });
  const slow = outcome({ waitMs: callMs + BROKER_MS, endToEndMs: callMs + BROKER_MS + callMs, deliveries, backlog });
  const grouped = outcome({ waitMs: callMs + BROKER_MS, endToEndMs: callMs + BROKER_MS + callMs, deliveries, backlog: groupBacklog, duplicates });

  return {
    frames: [
      {
        beat: "constraints",
        title: `The publisher calls ${subscribers} subscribers itself`,
        note: `Each event means ${subscribers} calls in a row: the publisher waits ${direct.publisherWaitMs} ms, and the last subscriber hears ${direct.endToEndMs} ms after the first. Adding a subscriber means changing and redeploying the publisher, and one that is down loses events or blocks the rest.`,
        metrics: direct,
      },
      {
        beat: "component",
        title: "Publish once to a broker",
        note: `The publisher sends one message and waits ${broker.publisherWaitMs} ms; the broker stores it and delivers to all ${subscribers} subscribers in parallel, ${broker.endToEndMs} ms end to end. Subscribers come and go without touching the publisher, and a broker holds events for one that is down.`,
        metrics: broker,
      },
      {
        beat: "failure",
        title: `One subscriber handles only ${slowSubscriberRps} a second`,
        note: `Events arrive at ${eventsPerSec} a second, so that subscriber falls ${eventsPerSec - slowSubscriberRps} events a second behind. After ${backlogMin} minutes its backlog is ${slow.slowSubscriberBacklog.toLocaleString("en-US")} events, each one older than the last. The publisher is unaffected, and so is unaware.`,
        metrics: slow,
      },
      {
        beat: "tradeoff",
        title: `${consumers} competing consumers, at-least-once delivery`,
        note: `A consumer group shares the work, and the backlog becomes ${grouped.slowSubscriberBacklog.toLocaleString("en-US")}. To not lose events the broker delivers at least once, so ${redeliveryPct}% repeat: ${grouped.duplicatesPerMin.toLocaleString("en-US")} duplicates a minute that subscribers must tolerate (p11). The broker is also a component that must stay up.`,
        metrics: grouped,
      },
    ],
    summary: { directWaitMs: direct.publisherWaitMs, brokerWaitMs: broker.publisherWaitMs },
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
