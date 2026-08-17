import { describe, expect, it, vi } from "vitest";
import { collapseEverySection, savedPreviewNotice, setRememberedActivityCollapse, supportsSavedActivityPreview, toggleCollapsedSection, type ActivitySectionCollapseController } from "./studioViewState";

describe("shared Lesson Studio view state", () => {
  it.each(["theory", "listening", "pronunciation", "practice", "quiz", "ai_speaking_mission"] as const)("supports saved preview for %s", (type) => expect(supportsSavedActivityPreview(type)).toBe(true));
  it("truthfully excludes Interactive Practice", () => expect(supportsSavedActivityPreview("interactive_practice")).toBe(false));
  it("shows the shared saved-content warning only while dirty", () => { expect(savedPreviewNotice(true)).toBe("Preview shows the last saved version."); expect(savedPreviewNotice(false)).toBeNull(); });
  it("remembers collapse independently for each activity", () => { const first = setRememberedActivityCollapse(new Set(), 1, true); expect(first.has(1)).toBe(true); expect(first.has(2)).toBe(false); expect(setRememberedActivityCollapse(first, 1, false).has(1)).toBe(false); });
  it("invokes a selected editor section controller", () => { const collapseAll = vi.fn(); const expandAll = vi.fn(); const controller: ActivitySectionCollapseController = { canCollapse: true, supportsSectionCollapse: true, sectionCount: 2, collapsedSectionCount: 0, collapseAll, expandAll }; controller.collapseAll(); controller.expandAll(); expect(collapseAll).toHaveBeenCalledOnce(); expect(expandAll).toHaveBeenCalledOnce(); });
  it.each([
    ["Listening", ["listening-1", "listening-2"]],
    ["Pronunciation", ["pronunciation-1", "pronunciation-2"]],
    ["Quiz", ["quiz-settings", "quiz-question-1"]],
    ["Legacy Practice", ["legacy-practice"]],
    ["AI Mission", ["mission-basics", "mission-practice", "mission-configuration", "mission-prompt", "mission-preview"]],
  ])("collapses and expands all stable %s sections", (_editor, ids) => {
    const collapsed = collapseEverySection(ids);
    expect(collapsed.size).toBe(ids.length);
    expect(new Set<string>().size).toBe(0);
  });
  it("toggles one section without replacing unrelated collapse state", () => {
    const current = new Set(["quiz-settings"]);
    const collapsed = toggleCollapsedSection(current, "quiz-question-1");
    expect(collapsed).toEqual(new Set(["quiz-settings", "quiz-question-1"]));
    expect(toggleCollapsedSection(collapsed, "quiz-question-1")).toEqual(new Set(["quiz-settings"]));
  });
});
