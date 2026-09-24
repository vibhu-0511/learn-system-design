import { describe, it, expect } from "vitest";
import { scoreDrill, VERDICTS } from "../drillScore.js";

const cleanState = {
  constraints: {
    qpsRead: "1000", qpsWrite: "100", latencyP95: "300",
    consistency: "eventual", durability: "medium", cost: "low",
    team: "5", growth: "10x",
  },
  components: [
    { id: "a", paletteId: "load-balancer", name: "LB", justification: "spreads traffic so we can scale api servers horizontally" },
    { id: "b", paletteId: "api-server", name: "API", justification: "stateless app logic, scales behind the lb" },
    { id: "c", paletteId: "sql-database", name: "DB", justification: "source of truth with nightly verified backups and restore drills" },
    { id: "d", paletteId: "observability", name: "Obs", justification: "request logs, p95 metric, error rate so we can debug" },
  ],
  rubric: { "constraints-stated": true, "every-component-justified": true },
};

describe("scoreDrill", () => {
  it("returns five axes each 0-100 plus total and verdict", () => {
    const s = scoreDrill(cleanState, ["load-balancer", "api-server", "sql-database"]);
    expect(Object.keys(s.axes).sort()).toEqual(
      ["availability", "cost", "latency", "scalability", "tradeoffs"].sort(),
    );
    for (const v of Object.values(s.axes)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(s.total).toBeGreaterThanOrEqual(0);
    expect(s.total).toBeLessThanOrEqual(100);
    expect(VERDICTS.map((t) => t.label)).toContain(s.verdict);
  });

  it("clean design scores higher than empty design", () => {
    const sClean = scoreDrill(cleanState, ["load-balancer", "api-server", "sql-database"]);
    const sEmpty = scoreDrill({ constraints: {}, components: [], rubric: {} }, ["load-balancer"]);
    expect(sClean.total).toBeGreaterThan(sEmpty.total);
  });

  it("verdict tiers map score bands", () => {
    expect(VERDICTS[0].min).toBe(0);
    const labels = VERDICTS.map((t) => t.label);
    expect(labels).toEqual(["Needs work", "Developing", "Solid", "Architect level"]);
  });
});
