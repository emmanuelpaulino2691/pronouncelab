import { describe, expect, it } from "vitest";
import { assertSavedMediaReference, buildTheoryBlockSavePayload, parseTheoryBlockRow } from "./theoryBlockPersistence";
import type { TheoryBlock } from "./types";

const mediaBlock = (blockType: "image" | "audio", mediaAssetId: string): TheoryBlock => ({
  id: 7, activityId: 2, blockType, position: 0, headingLevel: null,
  title: null, text: "", mediaAssetId, altText: blockType === "image" ? "A diagram" : null, updatedAt: "now",
});

describe("theory block persistence", () => {
  it.each(["image", "audio"] as const)("includes the %s media reference in the final save payload", (type) => {
    expect(buildTheoryBlockSavePayload(mediaBlock(type, "asset-123"))).toMatchObject({ media_asset_id: "asset-123" });
  });

  it("reloads a stable media reference from a saved row", () => {
    const parsed = parseTheoryBlockRow({ id: 7, activity_id: 2, block_type: "image", position: 0, heading_level: null, title: null, text: "", media_asset_id: "asset-123", alt_text: "A diagram", updated_at: "now" });
    expect(parsed.mediaAssetId).toBe("asset-123");
  });

  it("reloads the Audio reference, label, and transcript", () => {
    const parsed = parseTheoryBlockRow({ id: 8, activity_id: 2, block_type: "audio", position: 1, heading_level: null, title: "Listen and repeat", text: "Ship. Sheep.", media_asset_id: "audio-asset", alt_text: null, updated_at: "later" });
    expect(parsed).toMatchObject({ blockType: "audio", mediaAssetId: "audio-asset", title: "Listen and repeat", text: "Ship. Sheep." });
    expect(buildTheoryBlockSavePayload(parsed)).toMatchObject({ media_asset_id: "audio-asset", title: "Listen and repeat", text: "Ship. Sheep." });
  });

  it("never includes signed URLs in the persistence payload", () => {
    const payload = buildTheoryBlockSavePayload(mediaBlock("audio", "asset-123"));
    expect(JSON.stringify(payload)).not.toContain("signed");
    expect(payload).not.toHaveProperty("previewUrl");
  });

  it("persists replacement and removal through the same stable reference field", () => {
    expect(buildTheoryBlockSavePayload(mediaBlock("image", "replacement")).media_asset_id).toBe("replacement");
    expect(buildTheoryBlockSavePayload({ ...mediaBlock("audio", "old"), mediaAssetId: null }).media_asset_id).toBeNull();
  });

  it("rejects save success when the authoritative row loses the requested reference", () => {
    expect(() => assertSavedMediaReference(mediaBlock("image", "expected"), { ...mediaBlock("image", "expected"), mediaAssetId: null })).toThrow(/not saved with its selected media/i);
  });
});
