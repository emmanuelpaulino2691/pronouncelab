import { describe, expect, it } from "vitest";
import { buildCommandRegistry, getPaletteKeyAction, getPointerSelection, isCommandPaletteShortcut, matchCommands, moveActiveIndex, parseCommandHistory, recordCommandHistory } from ".";

const command = (id: string, title: string) => ({ id, title, category: "Navigation" as const, available: true, href: `/${id}` });

describe("global command palette domain", () => {
  it("builds navigation, templates, route context, and truthful future commands", () => {
    const registry = buildCommandRegistry({ pathname: "/admin/courses/1/units/2/lessons/3/studio", search: "?activity=4", canEditDrafts: true, canPublish: true, canViewMediaLibrary: true });
    expect(registry.some((item) => item.title === "Open Media Library" && item.available)).toBe(true);
    expect(registry.some((item) => item.category === "Template" && item.title === "Minimal Pairs")).toBe(true);
    expect(registry.some((item) => item.category === "Course")).toBe(true);
    expect(registry.some((item) => item.category === "Unit")).toBe(true);
    expect(registry.some((item) => item.category === "Lesson")).toBe(true);
    expect(registry.some((item) => item.category === "Activity")).toBe(true);
    expect(registry.find((item) => item.title === "Create Class")).toMatchObject({ available: false, unavailableReason: expect.any(String) });
  });

  it("ranks exact, prefix, contains, then stable order", () => {
    const results = matchCommands([command("contains", "My Quiz Library"), command("prefix", "Quiz Builder"), command("exact", "Quiz")], "quiz");
    expect(results.map((item) => item.id)).toEqual(["exact", "prefix", "contains"]);
    expect(matchCommands([command("a", "Alpha"), command("b", "Beta")], "").map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("uses recent commands as a bounded ranking boost", () => expect(matchCommands([command("a", "Open Alpha"), command("b", "Open Beta")], "open", ["b"])[0].id).toBe("b"));

  it("stores unique recent history newest-first with a maximum of twenty", () => {
    expect(recordCommandHistory(["a", "b"], "b")).toEqual(["b", "a"]);
    expect(recordCommandHistory(Array.from({ length: 20 }, (_, index) => String(index)), "new")).toHaveLength(20);
    expect(parseCommandHistory('["a",2,"b"]')).toEqual(["a", "b"]);
    expect(parseCommandHistory("bad")).toEqual([]);
  });

  it("supports command shortcuts and wrapping keyboard navigation", () => {
    expect(isCommandPaletteShortcut({ key: "k", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false })).toBe(true);
    expect(isCommandPaletteShortcut({ key: "K", ctrlKey: false, metaKey: true, shiftKey: false, altKey: false })).toBe(true);
    expect(isCommandPaletteShortcut({ key: "p", ctrlKey: true, metaKey: false, shiftKey: true, altKey: false })).toBe(true);
    expect(moveActiveIndex(0, -1, 3)).toBe(2);
    expect(moveActiveIndex(2, 1, 3)).toBe(0);
    expect(getPaletteKeyAction("Enter")).toBe("select");
    expect(getPaletteKeyAction("Escape")).toBe("close");
    expect(getPointerSelection(2, 3)).toBe(2);
    expect(getPointerSelection(3, 3)).toBe(-1);
  });
});
