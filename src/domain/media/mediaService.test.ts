import { describe, expect, it, vi } from "vitest";
import { controlledMediaQueryError, mediaListQueryPlan, mediaSelectionFromAsset, normalizeMediaAssetRow, resolveMediaAssetPreviewSafely, resolveMediaAssetPreviewWith, type MediaAssetRow } from "./service";

const row: MediaAssetRow = { id: "asset-id", kind: "image", original_filename: "lesson.png", mime_type: "image/png", bucket: "content-image-drafts", object_path: "private/lesson.png", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z", uploaded_by: "teacher-id" };

describe("Supabase media library service contracts", () => {
  it("queries the canonical owner-scoped presentation and normalizes its schema", () => { expect(mediaListQueryPlan({ kind: "all", search: "", sort: "newest" }).table).toBe("media_library_assets"); expect(normalizeMediaAssetRow(row)).toMatchObject({ id: "asset-id", filename: "lesson.png", objectPath: "private/lesson.png" }); });
  it.each(["image", "audio"] as const)("applies the %s filter", (kind) => expect(mediaListQueryPlan({ kind, search: "", sort: "newest" }).kind).toBe(kind));
  it("applies filename search", () => expect(mediaListQueryPlan({ kind: "all", search: "  lesson  ", sort: "newest" }).search).toBe("lesson"));
  it("maps RLS denial to a controlled permission error", () => expect(controlledMediaQueryError({ code: "42501" }).code).toBe("permission"));
  it.each([["newest", "created_at", false], ["oldest", "created_at", true], ["name-asc", "original_filename", true], ["name-desc", "original_filename", false]] as const)("maps %s sorting", (sort, column, ascending) => expect(mediaListQueryPlan({ kind: "all", search: "", sort }).order).toEqual({ column, ascending }));
  it.each([["content-image-drafts", "private/image.png"], ["content-audio-drafts", "private/audio.mp3"]])("generates a signed URL for private bucket %s", async (bucket, objectPath) => { const signedUrl = vi.fn().mockResolvedValue("signed-url"); const url = await resolveMediaAssetPreviewWith({ bucket, objectPath }, { publicUrl: vi.fn(), signedUrl }); expect(url).toBe("signed-url"); expect(signedUrl).toHaveBeenCalledWith(bucket, objectPath); });
  it("uses public URLs only for intentionally public buckets", async () => { const publicUrl = vi.fn().mockReturnValue("public-url"); expect(await resolveMediaAssetPreviewWith({ bucket: "content-images", objectPath: "public/image.png" }, { publicUrl, signedUrl: vi.fn() })).toBe("public-url"); });
  it("isolates one preview failure", async () => expect(await resolveMediaAssetPreviewSafely({ bucket: "content-image-drafts", objectPath: "missing" }, async () => { throw new Error("fail"); })).toEqual({ url: "", failed: true }));
  it("returns only stable identity and kind for persistence", () => { const selection = mediaSelectionFromAsset({ id: "asset-id", kind: "image", previewUrl: "signed-secret" } as { id: string; kind: "image"; previewUrl: string }); expect(selection).toEqual({ mediaAssetId: "asset-id", kind: "image" }); expect(JSON.stringify(selection)).not.toContain("signed-secret"); });
});
