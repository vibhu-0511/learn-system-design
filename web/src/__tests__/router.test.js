import { describe, it, expect } from "vitest";
import { parseHash, href } from "../router.js";

describe("router", () => {
  it("parses every route kind", () => {
    expect(parseHash("").name).toBe("home");
    expect(parseHash("#/").name).toBe("home");
    expect(parseHash("#/tracks").name).toBe("tracks");
    expect(parseHash("#/timeline").name).toBe("timeline");
    expect(parseHash("#/b04?tab=simulate")).toEqual({ name: "lesson", params: { id: "b04" }, query: { tab: "simulate" } });
    expect(parseHash("#/practice/outage/fastly_2021").params).toEqual({ tool: "outage", itemId: "fastly_2021" });
    expect(parseHash("#/practice").params).toEqual({ tool: undefined, itemId: undefined });
    expect(parseHash("#/nonsense").name).toBe("notfound");
    expect(parseHash("#/b04/extra").name).toBe("notfound");
  });

  it("round-trips routes through href, including vault paths with spaces", () => {
    const routes = [
      { name: "home", params: {}, query: {} },
      { name: "tracks", params: {}, query: {} },
      { name: "lesson", params: { id: "p10" }, query: { tab: "code" } },
      { name: "practice", params: { tool: "bugs", itemId: "checkout-double-charge" }, query: {} },
      { name: "library", params: { path: "System Design.md" }, query: {} },
      { name: "library", params: { path: "02_building_blocks/caching.md" }, query: {} },
    ];
    for (const r of routes) expect(parseHash(href(r))).toEqual(r);
  });
});
