import { describe, expect, it } from "vitest";
import { canMoveLearnBlock, canMutateLearnBlockMedia, collapseAllLearnBlocks, deletionFocusTarget, expandAllLearnBlocks, insertDuplicatedLearnBlock, isLearnBlockPopulated, learnBlockSummary, removeLearnBlock, reorderLearnBlocks, toggleLearnBlockCollapsed, validateLearnBlock } from "./learnBlockState";

const block = (id: number, position: number) => ({ id, activityId: 1, blockType: "paragraph" as const, position, headingLevel: null, title: null, text: String(id), mediaAssetId: null, altText: null, updatedAt: "" });

it("exposes Learn media mutation controls only for editable drafts", () => {
  expect(canMutateLearnBlockMedia(true)).toBe(true);
  expect(canMutateLearnBlockMedia(false)).toBe(false);
});
describe("Learn block state", () => {
  it("reorders blocks and normalizes positions", () => expect(reorderLearnBlocks([block(1, 0), block(2, 1)], 0, 1).map((item) => item.id)).toEqual([2, 1]));
  it("validates content-bearing blocks", () => expect(validateLearnBlock({ ...block(1, 0), text: "" })).toContain("text"));
  it("inserts a duplicate with a distinct ID immediately after its source", () => expect(insertDuplicatedLearnBlock([block(1, 0), block(2, 1)], 1, block(9, 2)).map((item) => item.id)).toEqual([1, 9, 2]));
  it.each(["heading", "paragraph", "example", "tip", "image", "audio"] as const)("duplicates %s with a new authoritative ID", (blockType) => {
    const source = { ...block(1, 0), blockType };
    const result = insertDuplicatedLearnBlock([source], source.id, { ...source, id: 99 });
    expect(result.map((item) => item.id)).toEqual([1, 99]);
  });
  it("preserves Image and Audio references on authoritative duplicates", () => {
    for (const blockType of ["image", "audio"] as const) {
      const source = { ...block(1, 0), blockType, mediaAssetId: `${blockType}-asset` };
      expect(insertDuplicatedLearnBlock([source], 1, { ...source, id: 2 })[1]).toMatchObject({ id: 2, mediaAssetId: `${blockType}-asset` });
    }
  });
  it("recognizes empty and populated blocks for confirmation", () => {
    expect(isLearnBlockPopulated({ ...block(1, 0), text: "" })).toBe(false);
    expect(isLearnBlockPopulated(block(1, 0))).toBe(true);
  });
  it("deletes and normalizes ordering", () => expect(removeLearnBlock([block(1, 0), block(2, 1), block(3, 2)], 2)).toEqual([block(1, 0), block(3, 1)]));
  it("keeps deleted IDs absent after an ordered reload", () => {
    const savedIds = removeLearnBlock([block(1, 0), block(2, 1), block(3, 2)], 2).map((item) => item.id);
    const reloaded = savedIds.map((id, position) => block(id, position));
    expect(reloaded.map((item) => item.id)).toEqual([1, 3]);
  });
  it("calculates next, previous, and Add Block focus fallbacks", () => {
    expect(deletionFocusTarget([block(1, 0), block(2, 1)], 1)).toBe(2);
    expect(deletionFocusTarget([block(1, 0), block(2, 1)], 2)).toBe(1);
    expect(deletionFocusTarget([block(1, 0)], 1)).toBe("add");
  });
  it("moves both directions, preserves IDs, and enforces boundaries", () => {
    expect(reorderLearnBlocks([block(1, 0), block(2, 1)], 0, 1).map((item) => item.id)).toEqual([2, 1]);
    expect(canMoveLearnBlock(0, -1, 2)).toBe(false);
    expect(canMoveLearnBlock(1, 1, 2)).toBe(false);
  });
  it("summarizes text and media without hiding validation", () => expect(learnBlockSummary({ ...block(1, 0), blockType: "audio", text: "", title: null }, "lesson.mp3")).toBe("lesson.mp3"));
  it("toggles one block, collapses all, and expands all", () => {
    expect(toggleLearnBlockCollapsed(new Set(), 1).has(1)).toBe(true);
    expect(toggleLearnBlockCollapsed(new Set([1]), 1).has(1)).toBe(false);
    expect([...collapseAllLearnBlocks([block(1, 0), block(2, 1)])]).toEqual([1, 2]);
    expect(expandAllLearnBlocks().size).toBe(0);
  });
});
