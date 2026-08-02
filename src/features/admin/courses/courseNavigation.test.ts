import { describe, expect, it } from "vitest";
import { courseWorkspacePath } from "./courseNavigation";

describe("first-course continuation", () => {
  it("opens the created course workspace", () => {
    expect(courseWorkspacePath(42)).toBe("/admin/courses/42");
  });
});
