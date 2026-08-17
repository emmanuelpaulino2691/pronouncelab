import { describe, expect, it } from "vitest";
import { parseMediaLibraryQuery, updateMediaLibraryQuery } from "./mediaLibraryQuery";
import { mediaAssetMetadata } from "./mediaAssetPresentation";
import type { MediaAssetSummary } from "../../../domain/media";

const asset = (kind: "image" | "audio"): MediaAssetSummary => ({ id: "asset-1", kind, filename: `${kind}.file`, mimeType: kind === "image" ? "image/png" : "audio/mpeg", bucket: "draft", objectPath: "path", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", uploadedBy: null });

describe("Media Library query and cards", () => {
  it("parses and preserves valid filter, search, and sort URL state", () => expect(parseMediaLibraryQuery(new URLSearchParams("kind=audio&search=lesson&sort=name-desc"))).toEqual({ kind: "audio", search: "lesson", sort: "name-desc" }));
  it("uses truthful defaults and removes default query values", () => { expect(parseMediaLibraryQuery(new URLSearchParams("kind=video&sort=bad"))).toEqual({ kind: "all", search: "", sort: "newest" }); expect(updateMediaLibraryQuery(new URLSearchParams("kind=audio&sort=oldest"), { kind: "all", sort: "newest" }).toString()).toBe(""); });
  it("exposes image metadata without fake usage", () => expect(mediaAssetMetadata(asset("image"))).toEqual({ filename: "image.file", kindLabel: "Image", mimeType: "image/png", usageCount: undefined }));
  it("exposes audio metadata without fake usage", () => expect(mediaAssetMetadata(asset("audio")).kindLabel).toBe("Audio"));
});
