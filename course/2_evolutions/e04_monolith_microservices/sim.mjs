// e04 sim: when splitting a monolith into services pays for itself.
// Model: a team of E engineers loses part of its output to coordination, and that loss
// grows with the number of people who must agree (1% per extra person, capped at 60%).
// A modular monolith halves the loss with clear module boundaries. Services shrink each
// team but need platform engineers to run them, and every request crosses several
// network hops.
// Assumptions: one platform engineer per two services; one team of `teamSize` per service.
// Runs in Node (node sim.mjs --engineers=12) and in the browser.

export const PARAMS = {
  engineers: { label: "Engineers today", unit: "", min: 4, max: 60, step: 1, default: 8 },
  services: { label: "Services in a premature split", unit: "", min: 2, max: 20, step: 1, default: 6 },
  bigEngineers: { label: "Engineers at scale", unit: "", min: 50, max: 500, step: 10, default: 120 },
  teamSize: { label: "Engineers per service team", unit: "", min: 3, max: 10, step: 1, default: 6 },
  hopMs: { label: "One network hop", unit: "ms", min: 1, max: 20, step: 1, default: 5 },
};

const COORDINATION_PER_PERSON = 0.01;
const COORDINATION_CAP = 0.6;
const MODULE_BOUNDARY_SAVING = 0.5;
const ENGINEERS_PER_PLATFORM_SERVICE = 0.5;
const HOPS_PER_REQUEST = 4;
const round1 = (n) => Math.round(n * 10) / 10;

const coordinationLoss = (peopleWhoMustAgree) => Math.min(COORDINATION_CAP, COORDINATION_PER_PERSON * (peopleWhoMustAgree - 1));

function outcome({ engineers, infraEngineers, loss, hops }, hopMs) {
  return {
    productiveEngineers: round1((engineers - infraEngineers) * (1 - loss)),
    infraEngineers,
    coordinationLossPct: round1(loss * 100),
    extraLatencyMs: round1(hops * hopMs),
  };
}

export function run({ engineers, services, bigEngineers, teamSize, hopMs }) {
  const monolith = outcome({ engineers, infraEngineers: 0, loss: coordinationLoss(engineers), hops: 0 }, hopMs);
  const modular = outcome({ engineers, infraEngineers: 0, loss: coordinationLoss(engineers) * MODULE_BOUNDARY_SAVING, hops: 0 }, hopMs);

  const earlyInfra = Math.ceil(services * ENGINEERS_PER_PLATFORM_SERVICE);
  const premature = outcome({ engineers, infraEngineers: earlyInfra, loss: coordinationLoss(teamSize), hops: HOPS_PER_REQUEST }, hopMs);

  const bigServices = Math.max(1, Math.round(bigEngineers / teamSize));
  const bigInfra = Math.ceil(bigServices * ENGINEERS_PER_PLATFORM_SERVICE);
  const bigMonolith = outcome({ engineers: bigEngineers, infraEngineers: 0, loss: coordinationLoss(bigEngineers), hops: 0 }, hopMs);
  const bigSplit = outcome({ engineers: bigEngineers, infraEngineers: bigInfra, loss: coordinationLoss(teamSize), hops: HOPS_PER_REQUEST }, hopMs);

  return {
    frames: [
      {
        beat: "constraints",
        title: `One monolith, ${engineers} engineers`,
        note: `Everyone shares one codebase and one deploy. Coordination costs ${monolith.coordinationLossPct}% of output, which is ${monolith.productiveEngineers} productive engineers, and there is no platform to run.`,
        metrics: monolith,
      },
      {
        beat: "component",
        title: "A modular monolith",
        note: `Same single deploy, but with clear module boundaries inside. The coordination loss halves to ${modular.coordinationLossPct}% (${modular.productiveEngineers} productive engineers) with no new infrastructure. This is the right next step for most teams.`,
        metrics: modular,
      },
      {
        beat: "failure",
        title: `${services} services from day one`,
        note: `${earlyInfra} of ${engineers} engineers now run the platform, leaving ${premature.productiveEngineers} productive. Every request pays ${premature.extraLatencyMs} ms in network hops, and simple changes cross services. This is the failure the note warns about.`,
        metrics: premature,
      },
      {
        beat: "tradeoff",
        title: `The same split at ${bigEngineers} engineers`,
        note: `At scale a monolith loses ${bigMonolith.coordinationLossPct}% of output to coordination (${bigMonolith.productiveEngineers} productive). ${bigServices} services need ${bigInfra} platform engineers and add ${bigSplit.extraLatencyMs} ms per request, yet ${bigSplit.productiveEngineers} are productive. Splitting pays only when the team is big.`,
        metrics: bigSplit,
      },
    ],
    summary: { prematureProductive: premature.productiveEngineers, bigSplitProductive: bigSplit.productiveEngineers, bigMonolithProductive: bigMonolith.productiveEngineers },
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
