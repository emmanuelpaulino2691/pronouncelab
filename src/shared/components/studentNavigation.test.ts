import { describe, expect, it } from "vitest";
import { studentNavigationItems } from "./studentNavigation";

describe("student navigation wording", () => {
  it("labels the learner root as Home without changing its route", () => {
    expect(studentNavigationItems[0]).toEqual({ label: "Home", to: "/" });
    expect(studentNavigationItems.some((item) => String(item.label) === "Dashboard")).toBe(false);
  });
  it("exposes the final learner information architecture", () => {
    expect(studentNavigationItems).toEqual([
      { label:"Home",to:"/" },{ label:"My Classes",to:"/classes" },{ label:"Course Library",to:"/courses" },{ label:"Progress",to:"/progress" },
    ]);
  });
});
