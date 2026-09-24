import { describe, it, expect } from "vitest";
import { injectFailure, FAILURE_MODES } from "../failureSim.js";

const components = [
  { id: "lb1", paletteId: "load-balancer", name: "LB" },
  { id: "api1", paletteId: "api-server", name: "API" },
  { id: "db1", paletteId: "sql-database", name: "DB" },
];
const edges = [
  { id: "e1", from: "client", to: "lb1" },
  { id: "e2", from: "lb1", to: "api1" },
  { id: "e3", from: "api1", to: "db1" },
];
const constraints = { qpsRead: "1000", qpsWrite: "100" };

describe("injectFailure", () => {
  it("dead component zeroes its downstream flow", () => {
    const r = injectFailure(constraints, components, edges, "api1", "dead");
    expect(r.after.nodes.db1.qpsIn).toBe(0);
    expect(r.impacts.some((i) => i.componentId === "db1" && i.kind === "starved")).toBe(true);
  });
  it("slow component halves its throughput and flags latency", () => {
    const r = injectFailure(constraints, components, edges, "db1", "slow");
    expect(r.impacts.some((i) => i.componentId === "db1" && i.kind === "latency")).toBe(true);
  });
  it("exposes five failure modes", () => {
    expect(FAILURE_MODES.map((m) => m.id)).toEqual(["slow", "dead", "partitioned", "drop1", "drop50"]);
  });
});
