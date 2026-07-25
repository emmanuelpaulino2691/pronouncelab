import { describe, expect, it } from "vitest";
import { reorderLearnBlocks, validateLearnBlock } from "./learnBlockState";

const block = (id: number, position: number) => ({ id, activityId: 1, blockType: "paragraph" as const, position, headingLevel: null, title: null, text: String(id), mediaAssetId: null, altText: null, updatedAt: "" });
describe("Learn block state", () => {
  it("reorders blocks and normalizes positions", () => expect(reorderLearnBlocks([block(1, 0), block(2, 1)], 0, 1).map((item) => item.id)).toEqual([2, 1]));
  it("validates content-bearing blocks", () => expect(validateLearnBlock({ ...block(1, 0), text: "" })).toContain("text"));
});
