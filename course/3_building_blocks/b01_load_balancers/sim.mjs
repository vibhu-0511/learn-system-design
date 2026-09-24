// b01 sim: spreading traffic over servers, and noticing when one has died.
// Assumptions: round robin sends every server an equal share, including a dead one until
// it is removed; without health checks a person notices after 5 minutes; with them the
// balancer removes a server after `failuresToRemove` failed checks, one every
// `checkIntervalSec`; requests beyond a server's capacity fail.
// Runs in Node (node sim.mjs --checkIntervalSec=5) and in the browser.

export const PARAMS = {
  servers: { label: "Servers", unit: "", min: 2, max: 10, step: 1, default: 4 },
  serverRps: { label: "One server's capacity", unit: "req/s", min: 100, max: 1000, step: 50, default: 500 },
  loadRps: { label: "Traffic", unit: "req/s", min: 200, max: 8000, step: 100, default: 1200 },
  checkIntervalSec: { label: "Health check interval", unit: "s", min: 1, max: 30, step: 1, default: 10 },
  failuresToRemove: { label: "Failed checks before removal", unit: "", min: 1, max: 5, step: 1, default: 3 },
};

const HUMAN_NOTICE_SEC = 300;
const round1 = (n) => Math.round(n * 10) / 10;

function outcome({ busiest, failedPerSec, incidentFailures, active }) {
  return {
    busiestServerPct: round1(busiest * 100),
    failedPerSec: Math.round(failedPerSec),
    incidentFailures: Math.round(incidentFailures),
    activeServers: active,
  };
}

export function run({ servers, serverRps, loadRps, checkIntervalSec, failuresToRemove }) {
  // DNS points at one server, so it takes everything and sheds what it cannot serve.
  const solo = outcome({ busiest: loadRps / serverRps, failedPerSec: Math.max(0, loadRps - serverRps), incidentFailures: 0, active: 1 });

  const share = loadRps / servers;
  const spread = outcome({ busiest: share / serverRps, failedPerSec: Math.max(0, (share - serverRps) * servers), incidentFailures: 0, active: servers });

  // One server dies. Round robin keeps sending it 1/N of the traffic, and all of it fails.
  const deadShare = loadRps / servers;
  const blind = outcome({ busiest: share / serverRps, failedPerSec: deadShare, incidentFailures: deadShare * HUMAN_NOTICE_SEC, active: servers });

  // Health checks pull it out after a few failed checks, then the survivors carry everything.
  const detectionSec = checkIntervalSec * failuresToRemove;
  const survivors = servers - 1;
  const checked = outcome({
    busiest: loadRps / survivors / serverRps,
    failedPerSec: Math.max(0, loadRps - survivors * serverRps),
    incidentFailures: deadShare * detectionSec,
    active: survivors,
  });

  return {
    frames: [
      {
        beat: "constraints",
        title: "DNS points at one server",
        note: `${servers} servers exist but all ${loadRps} req/s go to one that handles ${serverRps}: it runs at ${solo.busiestServerPct}% and ${solo.failedPerSec} req/s fail.`,
        metrics: solo,
      },
      {
        beat: "component",
        title: "A load balancer, round robin",
        note: `Traffic spreads evenly: ${round1(share)} req/s each, ${spread.busiestServerPct}% utilization, no failures.`,
        metrics: spread,
      },
      {
        beat: "failure",
        title: "One server dies, nobody notices",
        note: `Round robin still sends it 1/${servers} of the traffic, so ${blind.failedPerSec} req/s fail until someone notices, about ${HUMAN_NOTICE_SEC / 60} minutes: ${blind.incidentFailures} failed requests.`,
        metrics: blind,
      },
      {
        beat: "tradeoff",
        title: "Health checks remove it",
        note: `A check every ${checkIntervalSec} s and ${failuresToRemove} failures take ${detectionSec} s, so ${checked.incidentFailures} requests still fail. Then ${survivors} survivors run at ${checked.busiestServerPct}%. Faster checks lose fewer requests but risk removing a healthy server on a blip.`,
        metrics: checked,
      },
    ],
    summary: { blindFailures: blind.incidentFailures, checkedFailures: checked.incidentFailures },
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
