import { describe, expect, it, vi } from "vitest";
import { resolveLearnMediaAssetRow } from "./learnMediaService";

const audioRow = {
  id: "audio-asset",
  kind: "audio" as const,
  original_filename: "lesson.mp3",
  bucket: "content-audio-drafts",
  object_path: "teacher/learn/audio.mp3",
  mime_type: "audio/mpeg",
};

describe("Learn media resolution", () => {
  it("regenerates a signed Audio URL from the saved media row after reload", async () => {
    const createSignedUrl = vi.fn()
      .mockResolvedValueOnce("https://signed.example/first")
      .mockResolvedValueOnce("https://signed.example/second");
    const first = await resolveLearnMediaAssetRow(audioRow, createSignedUrl);
    const refreshed = await resolveLearnMediaAssetRow(audioRow, createSignedUrl);
    expect(first.previewUrl).toBe("https://signed.example/first");
    expect(refreshed).toMatchObject({ id: "audio-asset", mimeType: "audio/mpeg", previewUrl: "https://signed.example/second" });
    expect(createSignedUrl).toHaveBeenNthCalledWith(2, "content-audio-drafts", "teacher/learn/audio.mp3");
  });

  it("keeps Image resolution behavior unchanged", async () => {
    const image = await resolveLearnMediaAssetRow({ ...audioRow, id: "image-asset", kind: "image", bucket: "content-image-drafts", mime_type: "image/png" }, async () => "https://signed.example/image");
    expect(image).toMatchObject({ id: "image-asset", mimeType: "image/png", previewUrl: "https://signed.example/image" });
  });
});
