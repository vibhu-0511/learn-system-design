// m06 sim: a tiny design linter, the review checklist run as code over a sample design.
// It is a small reimplementation of the idea behind the app's drill linter: each rule is a short
// predicate over the constraints and the components, and a fired rule is one finding with a severity.
// Assumptions: the seven rules and their thresholds (a load balancer above 5,000 reads/s, a cache
// when the target is 100 ms or less at 1,000+ reads/s, a single SQL primary above 5,000 writes/s,
// rate limiting at 1,000+ total req/s, fewer than 8 engineers with more than 2 services) are the
// sim's round numbers. Risk score = 3 per high, 2 per medium, 1 per low.
// Runs in Node (node sim.mjs --readRps=800) and in the browser.

export const PARAMS = {
  readRps: { label: "Reads", unit: "req/s", min: 100, max: 100000, step: 100, default: 8000 },
  writeRps: { label: "Writes", unit: "req/s", min: 10, max: 50000, step: 10, default: 6000 },
  latencyP95Ms: { label: "p95 latency target", unit: "ms", min: 20, max: 1000, step: 10, default: 80 },
  teamSize: { label: "Engineers", unit: "people", min: 1, max: 50, step: 1, default: 5 },
  services: { label: "API services", unit: "", min: 1, max: 8, step: 1, default: 3 },
  hasLoadBalancer: { label: "Load balancer (1 = yes)", unit: "", min: 0, max: 1, step: 1, default: 0 },
  hasCache: { label: "Cache (1 = yes)", unit: "", min: 0, max: 1, step: 1, default: 0 },
  cacheHasTtl: { label: "Cache has TTL or invalidation (1 = yes)", unit: "", min: 0, max: 1, step: 1, default: 0 },
  hasObservability: { label: "Metrics, logs, traces (1 = yes)", unit: "", min: 0, max: 1, step: 1, default: 0 },
  hasRateLimit: { label: "Rate limiting (1 = yes)", unit: "", min: 0, max: 1, step: 1, default: 0 },
};

const RULES = [
  { id: "no-load-balancer-at-scale", severity: "high", when: (d) => d.readRps > 5000 && !d.hasLoadBalancer },
  { id: "low-latency-no-cache", severity: "high", when: (d) => d.latencyP95Ms <= 100 && d.readRps >= 1000 && !d.hasCache },
  { id: "sql-write-bottleneck", severity: "medium", when: (d) => d.writeRps > 5000 },
  { id: "cache-no-invalidation", severity: "medium", when: (d) => d.hasCache && !d.cacheHasTtl },
  { id: "no-observability", severity: "medium", when: (d) => !d.hasObservability },
  { id: "no-rate-limit", severity: "medium", when: (d) => d.readRps + d.writeRps >= 1000 && !d.hasRateLimit },
  { id: "microservices-small-team", severity: "low", when: (d) => d.teamSize < 8 && d.services > 2 },
];

const WEIGHT = { high: 3, medium: 2, low: 1 };

function lint(design) {
  return RULES.filter((r) => r.when(design));
}

function metricsOf(findings) {
  const count = (s) => findings.filter((f) => f.severity === s).length;
  return {
    findings: findings.length,
    high: count("high"),
    medium: count("medium"),
    low: count("low"),
    riskScore: findings.reduce((sum, f) => sum + WEIGHT[f.severity], 0),
  };
}

export function run(params) {
  const all = lint(params);
  const highs = all.filter((f) => f.severity === "high");
  const names = (list) => (list.length ? list.map((f) => f.id).join(", ") : "none");

  // the quick fix for each high finding: add the missing box, and think no further
  const patched = { ...params };
  if (highs.some((f) => f.id === "no-load-balancer-at-scale")) patched.hasLoadBalancer = 1;
  if (highs.some((f) => f.id === "low-latency-no-cache")) patched.hasCache = 1;
  const after = lint(patched);
  const appeared = after.filter((f) => !all.some((a) => a.id === f.id));
  const m = metricsOf(all);
  const mAfter = metricsOf(after);

  return {
    frames: [
      {
        beat: "constraints",
        title: `Sample design: ${params.readRps.toLocaleString("en-US")} reads and ${params.writeRps.toLocaleString("en-US")} writes a second, p95 ${params.latencyP95Ms} ms`,
        note: `${params.services} API services for ${params.teamSize} engineers. Load balancer: ${params.hasLoadBalancer ? "yes" : "no"}. Cache: ${params.hasCache ? "yes" : "no"}. Observability: ${params.hasObservability ? "yes" : "no"}. Rate limiting: ${params.hasRateLimit ? "yes" : "no"}. Run the checklist before you say you are done.`,
        metrics: { findings: 0, high: 0, medium: 0, low: 0, riskScore: 0 },
      },
      {
        beat: "component",
        title: `The checklist fires ${m.findings} finding${m.findings === 1 ? "" : "s"}`,
        note: `Each rule is a one-line predicate, so the result is auditable: ${names(all)}. Risk score ${m.riskScore}.`,
        metrics: m,
      },
      {
        beat: "failure",
        title: `${highs.length} high-severity: ${names(highs)}`,
        note: `High findings are the ones that fail the review outright: ${highs.length ? "a single point of failure or a target the design cannot meet" : "nothing here blocks the design"}. Everything else is a question the interviewer is likely to ask.`,
        metrics: metricsOf(highs),
      },
      {
        beat: "tradeoff",
        title: `Patch the high ones and re-run: ${mAfter.findings} findings, risk ${mAfter.riskScore}`,
        note: `Adding a load balancer and a cache clears the high findings${appeared.length ? `, but the patch creates new ones: ${names(appeared)}` : ""}. Risk goes from ${m.riskScore} to ${mAfter.riskScore}. A checklist finds gaps; it does not design the fix, and a box added to silence a rule still needs a reason.`,
        metrics: mAfter,
      },
    ],
    summary: { findings: m.findings, afterPatch: mAfter.findings },
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
