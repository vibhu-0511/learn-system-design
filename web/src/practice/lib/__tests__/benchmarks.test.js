import { describe, it, expect } from "vitest";
import { BENCHMARKS } from "../../data/benchmarks.js";
import { COMPONENT_PALETTE } from "../../data/drillCases.js";

describe("benchmarks", () => {
  it("covers every palette component", () => {
    for (const c of COMPONENT_PALETTE) {
      expect(BENCHMARKS[c.id], `missing benchmark for ${c.id}`).toBeTruthy();
    }
  });
  it("has positive latency and qps", () => {
    for (const [id, b] of Object.entries(BENCHMARKS)) {
      expect(b.maxQps, id).toBeGreaterThan(0);
      expect(b.p50LatencyMs, id).toBeGreaterThanOrEqual(0);
      expect(typeof b.citation, id).toBe("string");
    }
  });
});
