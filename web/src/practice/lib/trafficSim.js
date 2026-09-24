import { BENCHMARKS } from "../data/benchmarks.js";

export function simulateTraffic(constraints = {}, components = [], edges = [], options = {}) {
  const totalQps =
    (parseInt(String(constraints.qpsRead).replace(/\D/g, ""), 10) || 0) +
    (parseInt(String(constraints.qpsWrite).replace(/\D/g, ""), 10) || 0);

  const ids = components.map((c) => c.id);
  const idSet = new Set(ids);
  let useEdges = edges.filter((e) => (e.from === "client" || idSet.has(e.from)) && idSet.has(e.to));
  if (useEdges.length === 0) {
    useEdges = components.map((c, i) => ({ id: `auto${i}`, from: "client", to: c.id }));
  }
  const hasInbound = new Set(useEdges.map((e) => e.to));
  for (const c of components) {
    if (!hasInbound.has(c.id) && useEdges.some((e) => e.from === c.id)) {
      useEdges.push({ id: `entry-${c.id}`, from: "client", to: c.id });
    }
  }

  const children = new Map([["client", []]]);
  const indegree = new Map(ids.map((id) => [id, 0]));
  for (const id of ids) children.set(id, []);
  for (const e of useEdges) {
    children.get(e.from)?.push(e.to);
    indegree.set(e.to, (indegree.get(e.to) || 0) + 1);
  }

  const qpsIn = new Map(ids.map((id) => [id, 0]));
  const queue = ["client"];
  const outFlow = new Map([["client", totalQps]]);
  const remaining = new Map(indegree);
  const visited = new Set();
  while (queue.length) {
    const node = queue.shift();
    visited.add(node);
    const kids = children.get(node) || [];
    if (kids.length === 0) continue;
    const comp = components.find((c) => c.id === node);
    const isSplitter = comp && comp.paletteId === "load-balancer";
    const flow = outFlow.get(node) || 0;
    const perChild = isSplitter ? flow / kids.length : flow;
    for (const kid of kids) {
      qpsIn.set(kid, (qpsIn.get(kid) || 0) + perChild);
      remaining.set(kid, remaining.get(kid) - 1);
      if (remaining.get(kid) === 0) {
        const kidComp = components.find((c) => c.id === kid);
        const baseCap = BENCHMARKS[kidComp.paletteId]?.maxQps ?? Infinity;
        const cap = baseCap * (options?.override?.[kid] ?? 1);
        outFlow.set(kid, Math.min(qpsIn.get(kid), cap));
        queue.push(kid);
      }
    }
  }
  const hasCycle = ids.some((id) => !visited.has(id) && (indegree.get(id) || 0) > 0);

  const nodes = {};
  for (const c of components) {
    const inQps = Math.round(qpsIn.get(c.id) || 0);
    const baseCap = BENCHMARKS[c.paletteId]?.maxQps ?? Infinity;
    const cap = baseCap * (options?.override?.[c.id] ?? 1);
    const utilization = cap === Infinity || cap === 0 ? (inQps > 0 ? Infinity : 0) : inQps / cap;
    nodes[c.id] = {
      name: c.name,
      paletteId: c.paletteId,
      qpsIn: inQps,
      capacity: cap,
      utilization: +(utilization === Infinity ? Infinity : utilization.toFixed(3)),
      status: utilization > 1 ? "overloaded" : utilization > 0.7 ? "hot" : "ok",
    };
  }
  return { nodes, hasCycle, totalQps, edges: useEdges };
}
