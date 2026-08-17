import { describe, expect, it } from "vitest";
import { activityTemplateRegistry, getActivityTemplate, groupTemplates, orderFavoriteTemplates, parseStoredTemplateIds, recordRecent, toggleFavorite } from ".";

describe("Smart Content Builder template registry", () => {
  it("groups the registry into supported categories", () => {
    const groups = groupTemplates();
    expect(Object.keys(groups)).toEqual(["learn", "listening", "pronunciation", "quiz", "ai-mission"]);
    expect(groups.pronunciation.map((item) => item.name)).toContain("Minimal Pairs");
    expect(groups.learn.every((item) => item.activityType === "theory")).toBe(true);
  });

  it("provides complete preview metadata", () => {
    expect(getActivityTemplate("pronunciation-pairs")).toMatchObject({ learnerLevel: "A1–C1", duration: "5–10 min", recommendedUse: expect.any(String), tags: ["Speaking", "Listening", "Pairs"] });
    expect(activityTemplateRegistry.every((item) => item.description && item.recommendedUse)).toBe(true);
  });

  it("toggles favorites without duplicates", () => {
    expect(toggleFavorite([], "a")).toEqual(["a"]);
    expect(toggleFavorite(["a", "b"], "a")).toEqual(["b"]);
    expect(orderFavoriteTemplates([{ id: "a" }, { id: "b" }], ["b"])[0].id).toBe("b");
  });

  it("keeps recent templates newest-first, unique, and limited to ten", () => {
    expect(recordRecent(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
    expect(recordRecent(Array.from({ length: 10 }, (_, index) => String(index)), "new")).toHaveLength(10);
  });

  it("filters malformed or unknown browser state", () => {
    expect(parseStoredTemplateIds('["learn-blank","unknown",2]', new Set(["learn-blank"]))).toEqual(["learn-blank"]);
    expect(parseStoredTemplateIds("bad", new Set())).toEqual([]);
  });
});
