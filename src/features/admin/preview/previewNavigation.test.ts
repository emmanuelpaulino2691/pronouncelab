import { describe, expect, it } from "vitest";
import { buildStudentPreviewUrl, previewExitPath, previewTarget, safePreviewReturnTo } from "./previewNavigation";

describe("preview navigation", () => {
  it("preserves an internal return target and activity", () => {
    expect(buildStudentPreviewUrl({ courseId: 1, lessonId: 2, returnTo: "/admin/courses/1/units/3/lessons/2/studio", activityId: 9 })).toContain("returnTo=%2Fadmin%2Fcourses%2F1%2Funits%2F3%2Flessons%2F2%2Fstudio");
  });
  it("rejects external return targets", () => {
    expect(safePreviewReturnTo("https://example.com", "/admin/courses/1")).toBe("/admin/courses/1");
  });
  it("persists explicit Published Preview through Course, Unit, and Lesson URLs", () => {
    const unit = buildStudentPreviewUrl({ courseId: 1, unitId: 3, target: "published" });
    const lesson = buildStudentPreviewUrl({ courseId: 1, lessonId: 2, target: "published" });
    expect(unit).toBe("/admin/preview/courses/1/units/3?preview=published");
    expect(lesson).toBe("/admin/preview/courses/1/lessons/2?preview=published");
    expect(previewTarget(new URL(`https://local${lesson}`).searchParams.get("preview"))).toBe("published");
  });
  it("defaults missing or invalid targets to Draft Preview without source fallback", () => {
    expect(previewTarget(null)).toBe("draft");
    expect(previewTarget("local")).toBe("draft");
  });
  it("returns to the exact origin and restores the selected Studio activity", () => {
    expect(previewExitPath("/admin/courses/1/units/3/lessons/2/studio?panel=content", "9", "/admin/courses/1")).toBe("/admin/courses/1/units/3/lessons/2/studio?panel=content&activity=9");
  });
});
