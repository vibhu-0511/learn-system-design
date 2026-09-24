import { describe, it, expect, beforeEach } from "vitest";
import { buildDeck, getDueItems, recordReview, _resetForTest } from "../reviewQueue.js";

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  _resetForTest();
});

describe("reviewQueue", () => {
  it("builds a deck from vocabulary terms with stable ids", () => {
    const deck = buildDeck();
    expect(deck.length).toBeGreaterThan(10);
    expect(deck.every((c) => c.id && c.front && c.back)).toBe(true);
  });

  it("new cards are all due", () => {
    const due = getDueItems(new Date());
    expect(due.length).toBe(buildDeck().length);
  });

  it("a Good review pushes the card into the future", () => {
    const [first] = getDueItems(new Date());
    recordReview(first.id, "good", new Date());
    const dueNow = getDueItems(new Date());
    expect(dueNow.some((c) => c.id === first.id)).toBe(false);
  });

  it("an Again review keeps the card due soon (within 1 day)", () => {
    const [first] = getDueItems(new Date());
    recordReview(first.id, "again", new Date());
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    expect(getDueItems(tomorrow).some((c) => c.id === first.id)).toBe(true);
  });
});
