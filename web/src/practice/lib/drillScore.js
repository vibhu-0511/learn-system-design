import { lintDrill, diffComponents } from "./drillLinter.js";

const RULE_AXIS_PENALTIES = {
  "missing-constraints":                 { tradeoffs: 40, scalability: 10, cost: 10 },
  "unjustified-component":               { tradeoffs: 15 },
  "cache-no-invalidation":               { availability: 15, tradeoffs: 10 },
  "queue-no-controls":                   { availability: 20 },
  "sql-write-bottleneck":                { scalability: 35 },
  "strong-with-cache":                   { tradeoffs: 20 },
  "microservices-small-team":            { cost: 25, tradeoffs: 10 },
  "sync-side-effects":                   { latency: 30, availability: 10 },
  "no-load-balancer-at-scale":           { scalability: 35, availability: 20 },
  "no-cdn-for-static":                   { latency: 20, cost: 20 },
  "no-observability":                    { availability: 25 },
  "no-rate-limit-on-public-api":         { availability: 20 },
  "high-durability-no-replication":      { availability: 35 },
  "search-via-sql":                      { scalability: 20, latency: 15 },
  "api-gateway-without-auth":            { availability: 10 },
  "payment-without-idempotency":         { availability: 30, tradeoffs: 15 },
  "low-latency-no-cache":                { latency: 40 },
  "blob-without-cdn":                    { latency: 20, cost: 15 },
  "no-backup-language-at-high-durability": { availability: 15 },
};

export const VERDICTS = [
  { min: 0,  label: "Needs work" },
  { min: 31, label: "Developing" },
  { min: 56, label: "Solid" },
  { min: 86, label: "Architect level" },
];

const AXES = ["scalability", "availability", "latency", "cost", "tradeoffs"];

export function scoreDrill(state, expectedComponents = []) {
  const findings = lintDrill(state);
  const axes = Object.fromEntries(AXES.map((a) => [a, 100]));

  for (const f of findings) {
    const penalties = RULE_AXIS_PENALTIES[f.ruleId] || { tradeoffs: 10 };
    for (const [axis, pts] of Object.entries(penalties)) {
      axes[axis] = Math.max(0, axes[axis] - pts);
    }
  }

  const diff = diffComponents(
    (state.components || []).map((c) => c.paletteId),
    expectedComponents,
  );
  for (const _missed of diff.missed) {
    axes.scalability = Math.max(0, axes.scalability - 5);
    axes.availability = Math.max(0, axes.availability - 5);
  }

  const rubricChecked = Object.values(state.rubric || {}).filter(Boolean).length;
  axes.tradeoffs = Math.min(100, axes.tradeoffs + Math.min(10, rubricChecked * 2));

  const total = Math.round(AXES.reduce((sum, a) => sum + axes[a], 0) / AXES.length);
  const verdict = [...VERDICTS].reverse().find((t) => total >= t.min).label;

  return { axes, total, verdict, findingsCount: findings.length, diff };
}
