// m05 sim: an ADR completeness checker. Does a decision record let someone understand WHY, later?
// Assumptions: the seven checks come from the vault's ADR template (status, context, constraints,
// options considered, decision, consequences, when to revisit). The thresholds are the sim's:
// at least 2 constraints and 2 options (a choice needs alternatives), at least 2 consequences (what
// improves and what gets harder). The "verbal ADR" is the vault's 15-second interview version:
// options, decision, reasoning and trade-offs, with no formal status or revisit date.
// Runs in Node (node sim.mjs --optionsListed=3) and in the browser.

export const PARAMS = {
  statusSet: { label: "Status recorded (1 = yes)", unit: "", min: 0, max: 1, step: 1, default: 1 },
  contextStated: { label: "Context stated (1 = yes)", unit: "", min: 0, max: 1, step: 1, default: 1 },
  constraintsCited: { label: "Constraints cited", unit: "", min: 0, max: 6, step: 1, default: 1 },
  optionsListed: { label: "Options compared", unit: "", min: 0, max: 5, step: 1, default: 1 },
  consequencesListed: { label: "Consequences listed", unit: "", min: 0, max: 5, step: 1, default: 1 },
  revisitTrigger: { label: "Says when to revisit (1 = yes)", unit: "", min: 0, max: 1, step: 1, default: 0 },
};

const FULL = { statusSet: 1, contextStated: 1, constraintsCited: 3, optionsListed: 3, consequencesListed: 3, revisitTrigger: 1 };

const CHECKS = [
  ["status", (a) => a.statusSet === 1],
  ["context", (a) => a.contextStated === 1],
  ["constraints (2+)", (a) => a.constraintsCited >= 2],
  ["options (2+)", (a) => a.optionsListed >= 2],
  ["decision ties to a constraint", (a) => a.constraintsCited >= 1],
  ["consequences (2+)", (a) => a.consequencesListed >= 2],
  ["revisit trigger", (a) => a.revisitTrigger === 1],
];

const VERBAL = [
  ["options considered", (a) => a.optionsListed >= 2],
  ["decision made", () => true],
  ["reasoning from constraints", (a) => a.constraintsCited >= 1],
  ["trade-off acknowledged", (a) => a.consequencesListed >= 1],
];

function score(checks, adr) {
  const failed = checks.filter(([, f]) => !f(adr)).map(([n]) => n);
  const total = checks.length;
  return {
    failed,
    metrics: {
      checksPassed: total - failed.length,
      checksTotal: total,
      completenessPct: Math.round(((total - failed.length) / total) * 100),
      missingCount: failed.length,
    },
  };
}

export function run(params) {
  const written = score(CHECKS, params);
  const full = score(CHECKS, FULL);
  const verbal = score(VERBAL, params);
  const list = (f) => (f.length ? f.join(", ") : "nothing");

  return {
    frames: [
      {
        beat: "constraints",
        title: "Why Kafka here? \"It was here when I joined.\"",
        note: "Six months from now nobody remembers the reasoning. A decision record keeps the why, not just the what: the problem, the forces, the options, the choice and what it costs.",
        metrics: { checksPassed: 0, checksTotal: 0, completenessPct: 0, missingCount: 0 },
      },
      {
        beat: "component",
        title: `A complete ADR passes ${full.metrics.checksPassed} of ${full.metrics.checksTotal} checks`,
        note: "Status, context, at least two constraints, at least two options, a decision that cites a constraint, at least two consequences (what improves, what gets harder), and a trigger for revisiting.",
        metrics: full.metrics,
      },
      {
        beat: "failure",
        title: `The record as written: ${written.metrics.checksPassed} of ${written.metrics.checksTotal}, ${written.metrics.completenessPct}% complete`,
        note: `Missing: ${list(written.failed)}. ${params.optionsListed < 2 ? "With one option listed it is an announcement, not a decision: nobody can see what was rejected. " : ""}${params.revisitTrigger ? "" : "With no revisit trigger, it will outlive the forces that justified it."}`,
        metrics: written.metrics,
      },
      {
        beat: "tradeoff",
        title: `The 15-second verbal ADR: ${verbal.metrics.checksPassed} of ${verbal.metrics.checksTotal}`,
        note: `In an interview you do not write the document; you say its core: options, decision, reasoning, trade-off. From your inputs that covers ${verbal.metrics.completenessPct}% (missing: ${list(verbal.failed)}). The full record adds status and a revisit trigger, which matter to a team that has to live with the choice.`,
        metrics: verbal.metrics,
      },
    ],
    summary: { writtenPct: written.metrics.completenessPct, verbalPct: verbal.metrics.completenessPct },
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
