import { describe, expect, it } from "vitest";
import { savedLearnActivity, savedPreviewNotice } from "./learnSavedPreview";
import type { TheoryBlock } from "./types";

const block = (id: number, blockType: TheoryBlock["blockType"]): TheoryBlock => ({ id, activityId: 5, blockType, position: id, headingLevel: blockType === "heading" ? 2 : null, title: blockType === "audio" ? "Listen" : null, text: "Saved text", mediaAssetId: blockType === "image" || blockType === "audio" ? `${blockType}-asset` : null, altText: blockType === "image" ? "Diagram" : null, updatedAt: "" });

describe("saved Learn preview", () => {
  it("maps every Learn block through the learner theory contract", () => {
    const activity = savedLearnActivity(5, ["heading", "paragraph", "example", "tip", "image", "audio"].map((type, index) => block(index, type as TheoryBlock["blockType"])), { 4: "image-url", 5: "audio-url" });
    expect(activity.blocks.map((item) => item.type)).toEqual(["heading", "paragraph", "example", "tip", "image", "audio"]);
    expect(activity.blocks[5]).toMatchObject({ type: "audio", label: "Listen", transcript: "Saved text", media: { url: "audio-url" } });
  });
  it("labels unsaved split previews as the last saved version", () => {
    expect(savedPreviewNotice(true)).toBe("Preview shows the last saved version.");
    expect(savedPreviewNotice(false)).toBeNull();
  });
});
