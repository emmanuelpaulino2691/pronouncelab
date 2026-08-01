import { describe, expect, it } from "vitest";
import { adminMediaLibraryPath, canDeleteMedia, canSelectMedia, canUploadMedia, canViewMediaLibrary, MediaLibraryUnavailableError, unavailableMediaLibraryService } from ".";

const permissions = (update: Partial<{ canAccessAdmin: boolean; canEditDrafts: boolean; canPublish: boolean; isAdmin: boolean }> = {}) => ({ canAccessAdmin: true, canEditDrafts: false, canPublish: false, isAdmin: false, ...update });

describe("media domain foundation", () => {
  it("uses the protected admin media route", () => expect(adminMediaLibraryPath).toBe("/admin/media"));
  it("allows teachers, editors, publishers, and administrators to view", () => { expect(canViewMediaLibrary(permissions({ canEditDrafts: true }))).toBe(true); expect(canViewMediaLibrary(permissions({ canPublish: true }))).toBe(true); expect(canViewMediaLibrary(permissions({ isAdmin: true }))).toBe(true); });
  it("hides the library from unauthorized roles", () => expect(canViewMediaLibrary(permissions())).toBe(false));
  it("restricts mutations without inventing backend ownership", () => { expect(canUploadMedia(permissions({ canPublish: true }))).toBe(false); expect(canSelectMedia(permissions({ canEditDrafts: true }))).toBe(true); expect(canDeleteMedia(permissions({ canEditDrafts: true }))).toBe(false); expect(canDeleteMedia(permissions({ isAdmin: true }))).toBe(true); });
  it("never simulates backend list success", async () => await expect(unavailableMediaLibraryService.listMedia({ kind: "all", search: "", sort: "newest" })).rejects.toBeInstanceOf(MediaLibraryUnavailableError));
});
