// e03 sim: getting a chat message to the other person, from polling to WebSockets.
// Assumptions: every message is delivered once; a poll that finds a message counts as
// useful and every other poll is wasted; an ordinary server handles 2,000 requests or 2,000
// new connections a second; a WebSocket push lands in about 50 ms; and when every
// connection drops at once (a deploy, a load balancer restart) every client reconnects
// within one second.
// Runs in Node (node sim.mjs --pollIntervalSec=5) and in the browser.

export const PARAMS = {
  users: { label: "Online users", unit: "", min: 1000, max: 500000, step: 1000, default: 100000 },
  pollIntervalSec: { label: "Poll interval", unit: "s", min: 1, max: 10, step: 1, default: 2 },
  messagesPerUserPerMin: { label: "Messages sent per user", unit: "per min", min: 0.5, max: 10, step: 0.5, default: 2 },
  connectionsPerServer: { label: "Connections one server can hold", unit: "", min: 5000, max: 100000, step: 5000, default: 10000 },
  groupSize: { label: "Members in a group chat", unit: "", min: 2, max: 500, step: 1, default: 50 },
};

const SERVER_RPS = 2000;
const PUSH_MS = 50;
const TIMEOUT_MS = 5000;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ requestsPerSec, wastedPct, latencyMs, servers, writesPerMessage }) {
  return {
    requestsPerSec: Math.round(requestsPerSec),
    wastedPct: round1(wastedPct),
    latencyMs: round1(latencyMs),
    servers,
    writesPerMessage,
  };
}

export function run({ users, pollIntervalSec, messagesPerUserPerMin, connectionsPerServer, groupSize }) {
  const messagesPerSec = (users * messagesPerUserPerMin) / 60;
  const socketServers = Math.ceil(users / connectionsPerServer);

  const pollsPerSec = users / pollIntervalSec;
  const polling = outcome({
    requestsPerSec: pollsPerSec,
    wastedPct: Math.max(0, (1 - messagesPerSec / pollsPerSec) * 100),
    latencyMs: (pollIntervalSec * 1000) / 2,
    servers: Math.ceil(pollsPerSec / SERVER_RPS),
    writesPerMessage: 1,
  });

  const sockets = outcome({ requestsPerSec: messagesPerSec, wastedPct: 0, latencyMs: PUSH_MS, servers: socketServers, writesPerMessage: 1 });

  const acceptCapacity = socketServers * SERVER_RPS;
  const storm = outcome({
    requestsPerSec: users,
    wastedPct: Math.max(0, (1 - acceptCapacity / users) * 100),
    latencyMs: users > acceptCapacity ? TIMEOUT_MS : PUSH_MS,
    servers: socketServers,
    writesPerMessage: 1,
  });

  const groups = outcome({ requestsPerSec: messagesPerSec, wastedPct: 0, latencyMs: PUSH_MS, servers: socketServers, writesPerMessage: groupSize });

  return {
    frames: [
      {
        beat: "constraints",
        title: `Poll every ${pollIntervalSec} s`,
        note: `${users} users asking "anything new?" send ${polling.requestsPerSec} requests a second, and ${polling.wastedPct}% find nothing. A message waits ${polling.latencyMs} ms on average, and it takes ${polling.servers} servers.`,
        metrics: polling,
      },
      {
        beat: "component",
        title: "WebSockets: the server pushes",
        note: `One long-lived connection per user, and traffic is only real messages: ${sockets.requestsPerSec} a second, delivered in ${sockets.latencyMs} ms by ${sockets.servers} servers holding ${connectionsPerServer} connections each.`,
        metrics: sockets,
      },
      {
        beat: "failure",
        title: "Every connection drops at once",
        note: `A deploy or load balancer restart makes ${users} clients reconnect in about a second, against ${acceptCapacity} new connections a second the fleet can accept. ${storm.wastedPct}% are turned away and retry, which is a retry storm (see p10).`,
        metrics: storm,
      },
      {
        beat: "tradeoff",
        title: `Group chat of ${groupSize}: copy on write`,
        note: `Writing each message into every member's inbox makes reads instant but costs ${groupSize} writes per message: ${Math.round(messagesPerSec * groupSize)} storage writes a second. Storing it once and reading it ${groupSize} times moves the cost to read time.`,
        metrics: groups,
      },
    ],
    summary: { pollingRequestsPerSec: polling.requestsPerSec, socketRequestsPerSec: sockets.requestsPerSec },
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
