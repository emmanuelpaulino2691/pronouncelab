import { describe, expect, it } from "vitest";
import { drawerKeyboardAction, shouldWrapDrawerFocus } from "./drawerKeyboard";

describe("student navigation drawer keyboard contract", () => {
  it("closes on Escape and traps Tab navigation", () => {
    expect(drawerKeyboardAction("Escape")).toBe("close");
    expect(drawerKeyboardAction("Tab")).toBe("trap-focus");
    expect(drawerKeyboardAction("Enter")).toBe("ignore");
  });
  it("wraps focus at both drawer boundaries", () => {
    expect(shouldWrapDrawerFocus(true, 0, 4)).toBe(true);
    expect(shouldWrapDrawerFocus(false, 4, 4)).toBe(true);
    expect(shouldWrapDrawerFocus(false, 2, 4)).toBe(false);
  });
});
