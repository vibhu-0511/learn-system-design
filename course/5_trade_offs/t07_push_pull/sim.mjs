// t07 sim: a decision calculator for notifications: clients polling, the server pushing, or both.
// Assumptions: `users` clients; polling asks every `pollSec` seconds and a poll returns data only
// when there is something new; each user gets `eventsPerUserPerHour` events (3.6 an hour makes 99%
// of 10 second polls empty, the vault note's figure); the server fleet handles `fleetCapRps`
// requests or pushes a second; a push holds one open connection per user; one celebrity post must
// reach `fans` users at once; in the hybrid design normal notifications are pushed, and celebrity
// content is not fanned out but fetched by the `activePct` of users with the app open, who poll
// for it every `pollSec` seconds.
// Runs in Node (node sim.mjs --fans=200000) and in the browser.

export const PARAMS = {
  users: { label: "Users", unit: "", min: 1000, max: 1000000, step: 1000, default: 100000 },
  pollSec: { label: "Poll interval", unit: "s", min: 1, max: 60, step: 1, default: 10 },
  eventsPerUserPerHour: { label: "Events per user", unit: "per hour", min: 0.1, max: 60, step: 0.1, default: 3.6 },
  fans: { label: "Fans of one celebrity", unit: "", min: 1000, max: 1000000, step: 1000, default: 50000 },
  fleetCapRps: { label: "Server capacity", unit: "req/s", min: 1000, max: 100000, step: 1000, default: 12000 },
  activePct: { label: "Users with the app open", unit: "%", min: 1, max: 100, step: 1, default: 10 },
};

const PUSH_DELAY_SEC = 0.05;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ rps, emptyPct, regularDelay, celebrityDelay, connections, peakLoad }) {
  return {
    serverRequestsRps: Math.round(rps),
    emptyResponsesPct: Math.round(emptyPct),
    regularDelaySec: round1(regularDelay * 100) / 100,
    celebrityDelaySec: round1(celebrityDelay),
    openConnections: connections,
    peakLoadPct: Math.round(peakLoad * 100),
  };
}

export function run({ users, pollSec, eventsPerUserPerHour, fans, fleetCapRps, activePct }) {
  const fmt = (n) => n.toLocaleString("en-US");
  const events = (users * eventsPerUserPerHour) / 3600;
  const pollRps = users / pollSec;
  const emptyPct = Math.max(0, (1 - events / pollRps) * 100);
  const active = users * (activePct / 100);
  const activePollRps = active / pollSec;

  const start = outcome({ rps: 0, emptyPct: 0, regularDelay: 0, celebrityDelay: 0, connections: 0, peakLoad: 0 });
  const pull = outcome({ rps: pollRps, emptyPct, regularDelay: pollSec / 2, celebrityDelay: pollSec / 2, connections: 0, peakLoad: pollRps / fleetCapRps });
  const push = outcome({ rps: events, emptyPct: 0, regularDelay: PUSH_DELAY_SEC, celebrityDelay: fans / fleetCapRps, connections: users, peakLoad: fans / fleetCapRps });
  const hybrid = outcome({
    rps: events + activePollRps,
    emptyPct: (activePollRps * (emptyPct / 100) / (events + activePollRps)) * 100,
    regularDelay: PUSH_DELAY_SEC,
    celebrityDelay: pollSec / 2,
    connections: users,
    peakLoad: (events + activePollRps) / fleetCapRps,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: `${fmt(users)} users, ${eventsPerUserPerHour} events an hour each`,
        note: `Users want notifications quickly, but new events are rare: ${fmt(Math.round(events))} a second across all users. A celebrity with ${fmt(fans)} fans can post at any moment.`,
        metrics: start,
      },
      {
        beat: "component",
        title: `Pull: every client polls every ${pollSec} s`,
        note: `Simple and stateless, but ${fmt(pull.serverRequestsRps)} requests a second, ${pull.emptyResponsesPct}% of them empty, and a notification waits ${pull.regularDelaySec} s on average. The fleet is ${pull.peakLoadPct}% used just asking.`,
        metrics: pull,
      },
      {
        beat: "failure",
        title: "Push: an open connection per user",
        note: `Only ${fmt(push.serverRequestsRps)} messages a second, and ${push.regularDelaySec} s delay, but ${fmt(push.openConnections)} connections stay open, and one celebrity post asks for ${fmt(fans)} sends at once: ${push.peakLoadPct}% of capacity, ${push.celebrityDelaySec} s to deliver, and a real risk of falling over.`,
        metrics: push,
      },
      {
        beat: "tradeoff",
        title: "Hybrid: push normal events, pull celebrity content",
        note: `Normal notifications are pushed, so they arrive in ${hybrid.regularDelaySec} s. Celebrity posts are not fanned out: the ${activePct}% of users with the app open fetch them, waiting ${hybrid.celebrityDelaySec} s on average. Load is ${fmt(hybrid.serverRequestsRps)} requests a second (${hybrid.peakLoadPct}% used), and you run both a connection tier and a pull path.`,
        metrics: hybrid,
      },
    ],
    summary: { pullRps: pull.serverRequestsRps, hybridRps: hybrid.serverRequestsRps },
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
