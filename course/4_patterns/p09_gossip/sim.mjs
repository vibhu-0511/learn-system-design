// p09 sim: spreading one piece of news (a node died) to every node in a cluster.
// Assumptions: time runs in rounds of one second; a central monitor can send `monitorSendsPerSec`
// messages a second; in gossip, every node that knows the news picks `fanout` random peers each
// round and tells them, and each message is lost with probability `lossPct`; a seeded random
// generator makes runs repeat; "reached" counts nodes that know the news when the run ends
// (all of them, or after 60 rounds).
// Runs in Node (node sim.mjs --nodes=5000) and in the browser.

export const PARAMS = {
  nodes: { label: "Nodes", unit: "", min: 10, max: 5000, step: 10, default: 1000 },
  fanout: { label: "Peers told per round", unit: "", min: 1, max: 5, step: 1, default: 3 },
  lossPct: { label: "Messages lost", unit: "%", min: 0, max: 50, step: 5, default: 20 },
  monitorSendsPerSec: { label: "Monitor send rate", unit: "msg/s", min: 10, max: 1000, step: 10, default: 100 },
};

const MAX_ROUNDS = 60;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spread(nodes, fanout, lossPct) {
  const random = rng(42);
  const knows = new Uint8Array(nodes);
  const sent = new Uint32Array(nodes);
  knows[0] = 1;
  let known = 1;
  let messages = 0;
  let rounds = 0;
  while (known < nodes && rounds < MAX_ROUNDS) {
    rounds++;
    const informed = [];
    for (let n = 0; n < nodes; n++) if (knows[n]) informed.push(n);
    for (const n of informed) {
      for (let i = 0; i < fanout; i++) {
        sent[n]++;
        messages++;
        let peer = Math.floor(random() * (nodes - 1));
        if (peer >= n) peer++;
        if (random() * 100 >= lossPct && !knows[peer]) {
          knows[peer] = 1;
          known++;
        }
      }
    }
  }
  return { rounds, messages, busiestNodeSends: Math.max(...sent), reachedPct: Math.round((known / nodes) * 100) };
}

export function run({ nodes, fanout, lossPct, monitorSendsPerSec }) {
  const central = {
    rounds: Math.ceil((nodes - 1) / monitorSendsPerSec),
    messages: nodes - 1,
    busiestNodeSends: nodes - 1,
    reachedPct: 100,
  };
  const gossip = spread(nodes, fanout, 0);
  const lossy = spread(nodes, 1, lossPct);
  const wide = spread(nodes, Math.min(10, fanout * 2), lossPct);

  return {
    frames: [
      {
        beat: "constraints",
        title: "One monitor tells everyone",
        note: `A central monitor sends ${central.messages.toLocaleString("en-US")} messages at ${monitorSendsPerSec} a second: ${central.rounds} s to reach everyone, all sent by one machine. If it crashes, nobody learns anything and nobody knows who is alive.`,
        metrics: central,
      },
      {
        beat: "component",
        title: `Gossip: tell ${fanout} random peers a round`,
        note: `Each node that knows the news tells ${fanout} random peers, so the number of nodes knowing it grows by a factor each round. All ${nodes.toLocaleString("en-US")} nodes know in ${gossip.rounds} rounds and no node sends more than ${gossip.busiestNodeSends} messages.`,
        metrics: gossip,
      },
      {
        beat: "failure",
        title: `Fanout 1 with ${lossPct}% lost messages`,
        note: `With one message per round and ${lossPct}% of them lost, spreading is slower: ${lossy.rounds} rounds to reach ${lossy.reachedPct}% of nodes. Some nodes hear late, so for a while different nodes hold different views.`,
        metrics: lossy,
      },
      {
        beat: "tradeoff",
        title: `Fanout ${Math.min(10, fanout * 2)}: faster news, more traffic`,
        note: `A bigger fanout spreads in ${wide.rounds} rounds even with ${lossPct}% loss, but the cluster sends ${wide.messages.toLocaleString("en-US")} messages, most of them telling nodes what they already know.`,
        metrics: wide,
      },
    ],
    summary: { gossipRounds: gossip.rounds, centralRounds: central.rounds },
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
