import { describe, expect, it } from "vitest";
import {
  canCreateDraftLesson,
  canCreateDraftUnit,
  canEditDraftLesson,
  canEditDraftUnit,
} from "./hierarchyAuthoring";

describe("progressive hierarchy authoring", () => {
  it("allows new drafts beneath draft and published parents", () => {
    expect(canCreateDraftUnit(true, "draft")).toBe(true);
    expect(canCreateDraftUnit(true, "published")).toBe(true);
    expect(canCreateDraftLesson(true, "published", "published")).toBe(true);
    expect(canCreateDraftLesson(true, "published", "draft")).toBe(true);
  });

  it("does not allow creation for archived parents or read-only roles", () => {
    expect(canCreateDraftUnit(true, "archived")).toBe(false);
    expect(canCreateDraftLesson(true, "published", "archived")).toBe(false);
    expect(canCreateDraftLesson(false, "published", "published")).toBe(false);
  });

  it("keeps existing published rows read-only", () => {
    expect(canEditDraftUnit(true, "published")).toBe(false);
    expect(canEditDraftUnit(true, "draft")).toBe(true);
    expect(canEditDraftLesson(true, "published", 10)).toBe(false);
    expect(canEditDraftLesson(true, "draft", null)).toBe(true);
  });
});
