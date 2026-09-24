import { describe, it, expect } from "vitest";
import { lintDrill, diffComponents, LINT_RULES_INDEX } from "../drillLinter.js";

const fullConstraints = {
  qpsRead: "1000", qpsWrite: "100", latencyP95: "300",
  consistency: "eventual", durability: "medium", cost: "low",
  team: "5", growth: "10x",
};

describe("lintDrill", () => {
  it("returns empty for null state", () => {
    expect(lintDrill(null)).toEqual([]);
  });

  it("fires missing-constraints when constraints are empty", () => {
    const findings = lintDrill({ constraints: {}, components: [] });
    expect(findings.some((f) => f.ruleId === "missing-constraints")).toBe(true);
  });

  it("fires unjustified-component per short justification", () => {
    const findings = lintDrill({
      constraints: fullConstraints,
      components: [
        { id: "a", paletteId: "cache", name: "Cache", justification: "fast" },
        { id: "b", paletteId: "api-server", name: "API", justification: "handles all the request routing logic" },
      ],
    });
    const unjust = findings.filter((f) => f.ruleId === "unjustified-component");
    expect(unjust).toHaveLength(1);
  });

  it("fires payment-without-idempotency on money language without idempotency", () => {
    const findings = lintDrill({
      constraints: fullConstraints,
      components: [
        { id: "a", paletteId: "api-server", name: "API", justification: "handles checkout and payment capture flows" },
      ],
    });
    expect(findings.some((f) => f.ruleId === "payment-without-idempotency")).toBe(true);
  });

  it("sorts findings high severity first", () => {
    const findings = lintDrill({
      constraints: fullConstraints,
      components: [
        { id: "a", paletteId: "cache", name: "Cache", justification: "speeds up the hot reads for product pages" },
      ],
    });
    const ranks = { high: 0, medium: 1, low: 2 };
    const sorted = [...findings].sort((a, b) => ranks[a.severity] - ranks[b.severity]);
    expect(findings.map((f) => f.id)).toEqual(sorted.map((f) => f.id));
  });
});

describe("diffComponents", () => {
  it("computes covered / missed / extra", () => {
    expect(diffComponents(["a", "b", "x"], ["a", "b", "c"])).toEqual({
      covered: ["a", "b"], missed: ["c"], extra: ["x"],
    });
  });
});

describe("LINT_RULES_INDEX", () => {
  it("every rule has at least one citation", () => {
    for (const rule of LINT_RULES_INDEX) {
      expect(rule.citations.length).toBeGreaterThan(0);
    }
  });
});
