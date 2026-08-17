import { describe, expect, it } from "vitest";
import { canCreateClass, canEditCourse, canPublishCourse, canViewStudentProgress } from "./predicates";
import { UserRole } from "../shared/constants";

describe("domain permission predicates", () => {
  it("keeps course editing owner-scoped and publishing role-aware", () => {
    expect(canEditCourse({ role: UserRole.Teacher, userId: "a", ownerId: "a", draft: true })).toBe(true);
    expect(canEditCourse({ role: UserRole.Teacher, userId: "b", ownerId: "a", draft: true })).toBe(false);
    expect(canPublishCourse({ role: UserRole.Publisher })).toBe(true);
  });
  it("limits future classroom capabilities to administrators and teachers", () => {
    expect(canCreateClass({ role: UserRole.Teacher })).toBe(true);
    expect(canCreateClass({ role: UserRole.Editor })).toBe(false);
    expect(canViewStudentProgress({ role: UserRole.Teacher, userId: "a", ownerId: "a" })).toBe(true);
  });
});
