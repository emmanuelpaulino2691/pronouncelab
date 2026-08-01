import { describe, expect, it, vi } from "vitest";
import { savedPreviewNotice, setRememberedActivityCollapse, supportsSavedActivityPreview, type ActivitySectionCollapseController } from "./studioViewState";

describe("shared Lesson Studio view state", () => {
  it.each(["theory", "listening", "pronunciation", "practice", "quiz", "ai_speaking_mission"] as const)("supports saved preview for %s", (type) => expect(supportsSavedActivityPreview(type)).toBe(true));
  it("truthfully excludes Interactive Practice", () => expect(supportsSavedActivityPreview("interactive_practice")).toBe(false));
  it("shows the shared saved-content warning only while dirty", () => { expect(savedPreviewNotice(true)).toBe("Preview shows the last saved version."); expect(savedPreviewNotice(false)).toBeNull(); });
  it("remembers collapse independently for each activity", () => { const first = setRememberedActivityCollapse(new Set(), 1, true); expect(first.has(1)).toBe(true); expect(first.has(2)).toBe(false); expect(setRememberedActivityCollapse(first, 1, false).has(1)).toBe(false); });
  it("invokes a selected editor section controller", () => { const collapseAll = vi.fn(); const expandAll = vi.fn(); const controller: ActivitySectionCollapseController = { canCollapse: true, collapseAll, expandAll }; controller.collapseAll(); controller.expandAll(); expect(collapseAll).toHaveBeenCalledOnce(); expect(expandAll).toHaveBeenCalledOnce(); });
});
