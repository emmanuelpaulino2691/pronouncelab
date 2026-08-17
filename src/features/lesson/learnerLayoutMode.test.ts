import { describe, expect, it } from "vitest";
import { lessonShellClass, usesCompactActivityNavigation } from "./learnerLayoutMode";

describe("learner layout mode", () => {
  it("uses compact full-width navigation for forced phone and tablet previews", () => {
    expect(usesCompactActivityNavigation("phone")).toBe(true);
    expect(usesCompactActivityNavigation("tablet")).toBe(true);
    expect(lessonShellClass("phone")).toContain("grid-cols-1");
    expect(lessonShellClass("phone")).not.toContain("15rem");
  });
  it("retains desktop columns and automatic learner-route behavior", () => {
    expect(lessonShellClass("desktop")).toContain("15rem");
    expect(usesCompactActivityNavigation("auto")).toBe(false);
    expect(lessonShellClass("auto")).toContain("lg:grid-cols");
  });
});
