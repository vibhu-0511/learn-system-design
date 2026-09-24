import { describe, it, expect } from "vitest";
import { simulateTraffic } from "../trafficSim.js";

const components = [
  { id: "lb1", paletteId: "load-balancer", name: "LB" },
  { id: "api1", paletteId: "api-server", name: "API" },
  { id: "api2", paletteId: "api-server", name: "API 2" },
  { id: "db1", paletteId: "sql-database", name: "DB" },
];
const edges = [
  { id: "e1", from: "client", to: "lb1" },
  { id: "e2", from: "lb1", to: "api1" },
  { id: "e3", from: "lb1", to: "api2" },
  { id: "e4", from: "api1", to: "db1" },
  { id: "e5", from: "api2", to: "db1" },
];

describe("simulateTraffic", () => {
  it("load balancer splits traffic; others fan out 100%", () => {
    const r = simulateTraffic({ qpsRead: "8000", qpsWrite: "0" }, components, edges);
    expect(r.nodes.lb1.qpsIn).toBe(8000);
    expect(r.nodes.api1.qpsIn).toBe(4000);
    expect(r.nodes.api2.qpsIn).toBe(4000);
    expect(r.nodes.db1.qpsIn).toBe(8000);
  });

  it("api-server at 4000 is ok (envelope 5000); at 10000 is overloaded", () => {
    const ok = simulateTraffic({ qpsRead: "8000", qpsWrite: "0" }, components, edges);
    expect(ok.nodes.api1.status).toBe("hot"); // 4000/5000 = 0.8 > 0.7

    const over = simulateTraffic({ qpsRead: "20000", qpsWrite: "0" }, components, edges);
    expect(over.nodes.api1.status).toBe("overloaded");
  });

  it("marks utilization 0-N and detects no cycles in DAG", () => {
    const r = simulateTraffic({ qpsRead: "1000", qpsWrite: "100" }, components, edges);
    expect(r.hasCycle).toBe(false);
    for (const n of Object.values(r.nodes)) {
      expect(n.utilization).toBeGreaterThanOrEqual(0);
    }
  });

  it("survives empty edges by fanning the client to every component", () => {
    const r = simulateTraffic({ qpsRead: "1000", qpsWrite: "0" }, components, []);
    expect(r.nodes.lb1.qpsIn).toBe(1000);
    expect(r.nodes.db1.qpsIn).toBe(1000);
  });
});
