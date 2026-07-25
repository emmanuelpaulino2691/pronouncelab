import { describe, expect, it } from "vitest";
import { buildStudentPreviewUrl, safePreviewReturnTo } from "./previewNavigation";

describe("preview navigation", () => {
  it("preserves an internal return target and activity", () => {
    expect(buildStudentPreviewUrl({ courseId: 1, lessonId: 2, returnTo: "/admin/courses/1/units/3/lessons/2/studio", activityId: 9 })).toContain("returnTo=%2Fadmin%2Fcourses%2F1%2Funits%2F3%2Flessons%2F2%2Fstudio");
  });
  it("rejects external return targets", () => {
    expect(safePreviewReturnTo("https://example.com", "/admin/courses/1")).toBe("/admin/courses/1");
  });
});
