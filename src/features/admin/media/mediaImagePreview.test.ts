import { describe, expect, it } from "vitest";
import { canOpenImagePreview, imagePreviewAlt, imagePreviewTitle, mediaImagePreviewDialogClassName, mediaImagePreviewImageClassName, nextImagePreviewState } from "./mediaImagePreview";

describe("Media Library image preview", () => {
  it("offers image inspection only when the card enables it", () => {
    expect(canOpenImagePreview("image", true)).toBe(true);
    expect(canOpenImagePreview("audio", true)).toBe(false);
    expect(canOpenImagePreview("image", false)).toBe(false);
  });
  it("uses the filename in the dialog title and meaningful image text", () => {
    expect(imagePreviewTitle("mouth-position.png")).toContain("mouth-position.png");
    expect(imagePreviewAlt("mouth-position.png")).toBe("Full-size preview of mouth-position.png");
  });
  it("preserves aspect ratio and prevents horizontal image overflow", () => {
    expect(mediaImagePreviewImageClassName).toContain("h-auto");
    expect(mediaImagePreviewImageClassName).toContain("max-w-full");
    expect(mediaImagePreviewImageClassName).toContain("object-contain");
  });
  it("uses a near-full-screen phone panel and a bounded desktop panel", () => {
    expect(mediaImagePreviewDialogClassName).toContain("100dvh");
    expect(mediaImagePreviewDialogClassName).toContain("max-w-6xl");
  });
  it("moves failed previews into a retryable state", () => {
    expect(nextImagePreviewState("ready", "failed")).toBe("error");
    expect(nextImagePreviewState("error", "retry")).toBe("retrying");
    expect(nextImagePreviewState("retrying", "loaded")).toBe("ready");
    expect(nextImagePreviewState("retrying", "failed")).toBe("error");
  });
});
