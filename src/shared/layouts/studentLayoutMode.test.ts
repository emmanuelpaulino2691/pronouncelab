import { describe, expect, it } from "vitest";
import { studentContentPaddingClass, studentMenuButtonClass, studentSidebarClass, usesCompactStudentShell } from "./studentLayoutMode";

describe("responsive student shell modes", () => {
  it("keeps the permanent sidebar in desktop mode", () => {
    expect(studentSidebarClass("desktop")).toBe("block");
    expect(studentMenuButtonClass("desktop")).toBe("hidden");
  });
  it("uses compact drawer navigation at tablet size", () => {
    expect(usesCompactStudentShell("tablet")).toBe(true);
    expect(studentSidebarClass("tablet")).toBe("hidden");
    expect(studentMenuButtonClass("tablet")).toBe("inline-flex");
  });
  it("removes the desktop sidebar and preserves full-width phone content", () => {
    expect(usesCompactStudentShell("phone")).toBe(true);
    expect(studentSidebarClass("phone")).not.toContain("block");
    expect(studentContentPaddingClass("phone")).toBe("p-3");
  });
  it("retains breakpoint-driven behavior for real learner routes", () => {
    expect(studentSidebarClass("auto")).toContain("lg:block");
    expect(studentMenuButtonClass("auto")).toContain("lg:hidden");
  });
});
