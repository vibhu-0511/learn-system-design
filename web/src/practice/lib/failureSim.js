import { simulateTraffic } from "./trafficSim.js";

export const FAILURE_MODES = [
  { id: "slow",        label: "Slow (10× latency)", effect: "Capacity halves; queues build upstream; timeouts decide user experience." },
  { id: "dead",        label: "Dead (crashed)",     effect: "Zero throughput; everything downstream starves; LB health checks decide recovery." },
  { id: "partitioned", label: "Network partition",  effect: "Reachable by some callers only; split-brain risk for stateful components." },
  { id: "drop1",       label: "Dropping 1%",        effect: "Retries amplify load; idempotency decides correctness." },
  { id: "drop50",      label: "Dropping 50%",       effect: "Retry storms; circuit breakers decide whether this cascades." },
];

const CAPACITY_FACTOR = { slow: 0.5, dead: 0, partitioned: 0.5, drop1: 0.99, drop50: 0.5 };

export function injectFailure(constraints, components, edges, targetId, mode) {
  const before = simulateTraffic(constraints, components, edges);
  const factor = CAPACITY_FACTOR[mode];
  const after = simulateTraffic(constraints, components, edges, { override: { [targetId]: factor } });

  const impacts = [];
  for (const [id, node] of Object.entries(after.nodes)) {
    const prev = before.nodes[id];
    if (id === targetId) {
      impacts.push({ componentId: id, kind: mode === "slow" ? "latency" : "degraded", detail: `${node.name} is the injected failure (${mode}).` });
      continue;
    }
    if (node.qpsIn === 0 && prev.qpsIn > 0) {
      impacts.push({ componentId: id, kind: "starved", detail: `${node.name} receives no traffic — upstream path is gone.` });
    } else if (node.status === "overloaded" && prev.status !== "overloaded") {
      impacts.push({ componentId: id, kind: "overloaded", detail: `${node.name} tips over absorbing redirected/retried load.` });
    }
  }
  return { before, after, impacts, mode };
}
