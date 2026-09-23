// Turns sim metric keys and values into what a learner reads.
// Convention: a key's suffix names its unit (hitRatePct, avgLatencyMs, dbLoadRps, maxStaleSec).

export const BEAT_LABEL = { constraints: "Constraints", component: "Component", failure: "Failure", tradeoff: "Trade-off" };

const UNITS = [
  ["Pct", "%"],
  ["Ms", " ms"],
  ["Rps", " req/s"],
  ["Sec", " s"],
];
const WORDS = { db: "DB", p99: "p99" };

const unitOf = (key) => UNITS.find(([suffix]) => key.endsWith(suffix) && key.length > suffix.length);

export function metricLabel(key) {
  const unit = unitOf(key);
  const stem = unit ? key.slice(0, -unit[0].length) : key;
  const [first, ...rest] = stem.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().split(" ");
  return [WORDS[first] ?? first[0].toUpperCase() + first.slice(1), ...rest].join(" ");
}

export function formatMetric(key, value) {
  const unit = unitOf(key);
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}${unit ? unit[1] : ""}`;
}

// "ok" | "hot" | "bad" | undefined, for the few metrics where color helps.
export function metricTone(key, value) {
  if (/utilization/i.test(key)) return value >= 100 ? "bad" : value >= 70 ? "hot" : "ok";
  if (/^dropped/i.test(key)) return value > 0 ? "bad" : undefined;
  return undefined;
}
