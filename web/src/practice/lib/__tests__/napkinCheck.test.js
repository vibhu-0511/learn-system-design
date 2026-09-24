import { describe, it, expect } from "vitest";
import { gradeAnswer } from "../napkinCheck.js";

describe("gradeAnswer", () => {
  it("exact and near answers are 'spot-on' (within ~2x)", () => {
    expect(gradeAnswer(5800, 5800).grade).toBe("spot-on");
    expect(gradeAnswer(10000, 5800).grade).toBe("spot-on");
  });
  it("same order of magnitude is 'close' (within 10x)", () => {
    expect(gradeAnswer(50000, 5800).grade).toBe("close");
  });
  it("off by more than 10x is 'off'", () => {
    expect(gradeAnswer(1000000, 5800).grade).toBe("off");
  });
  it("handles unit-suffixed input strings", () => {
    expect(gradeAnswer("20 GB", 20).grade).toBe("spot-on");
    expect(gradeAnswer("17k", 17000).grade).toBe("spot-on");
  });
  it("garbage input is 'invalid'", () => {
    expect(gradeAnswer("dunno", 100).grade).toBe("invalid");
  });
});
