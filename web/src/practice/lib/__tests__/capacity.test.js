import { describe, it, expect } from "vitest";
import { computeCapacity, simulateBottlenecks, phasedComponents, formatGB, formatUSD } from "../capacity.js";

const constraints = {
  qpsRead: "1000", qpsWrite: "500", latencyP95: "300",
  consistency: "strong", durability: "high", cost: "medium",
  team: "8", growth: "10x",
};
const components = [
  { id: "a", paletteId: "api-server", name: "API Server", justification: "stateless app logic for the public api" },
  { id: "b", paletteId: "sql-database", name: "SQL Database", justification: "transactional store for orders and the ledger" },
];

describe("computeCapacity", () => {
  it("applies 3x replication at high durability", () => {
    const cap = computeCapacity(constraints, components);
    expect(cap.inputs.replicationFactor).toBe(3);
    expect(cap.storage.withReplicationGB).toBeCloseTo(cap.storage.perYearGB * 3, 5);
  });
  it("derives positive numbers from positive QPS", () => {
    const cap = computeCapacity(constraints, components);
    expect(cap.storage.perDayGB).toBeGreaterThan(0);
    expect(cap.bandwidth.outMbps).toBeGreaterThan(0);
    expect(cap.cost.monthlyHigh).toBeGreaterThan(cap.cost.monthlyLow);
  });
});

describe("simulateBottlenecks", () => {
  it("returns four multipliers with monotonically scaled QPS", () => {
    const rows = simulateBottlenecks(constraints, components);
    expect(rows.map((r) => r.multiplier)).toEqual([2, 10, 100, 1000]);
    expect(rows[3].scaledQpsWrite).toBe(500 * 1000);
  });
  it("finds more breaks at 1000x than at 2x", () => {
    const rows = simulateBottlenecks(constraints, components);
    expect(rows[3].breaks.length).toBeGreaterThanOrEqual(rows[0].breaks.length);
  });
});

describe("phasedComponents", () => {
  it("each phase stack is a superset of the previous", () => {
    const phases = phasedComponents(constraints, components);
    for (let i = 1; i < phases.length; i++) {
      const prev = new Set(phases[i - 1].stack.map((c) => c.id));
      for (const id of prev) {
        expect(phases[i].stack.some((c) => c.id === id)).toBe(true);
      }
    }
  });
});

describe("formatters", () => {
  it("formatGB scales units", () => {
    expect(formatGB(0.5)).toBe("512.0 MB");
    expect(formatGB(2048)).toBe("2.00 TB");
  });
  it("formatUSD scales units", () => {
    expect(formatUSD(1500000)).toBe("$1.50M");
  });
});
