import { describe, expect, it } from "vitest";
import { studentNavigationItems } from "./studentNavigation";

describe("student navigation wording", () => {
  it("labels the learner root as Home without changing its route", () => {
    expect(studentNavigationItems[0]).toEqual({ label: "Home", to: "/" });
    expect(studentNavigationItems.some((item) => String(item.label) === "Dashboard")).toBe(false);
  });
});
