import { describe, expect, it } from "vitest";
import { isSaveShortcut } from "./saveShortcut";

describe("save shortcut", () => {
  it("accepts Ctrl+S and Command+S", () => {
    expect(isSaveShortcut({ key: "s", ctrlKey: true, metaKey: false, altKey: false })).toBe(true);
    expect(isSaveShortcut({ key: "S", ctrlKey: false, metaKey: true, altKey: false })).toBe(true);
  });

  it("does not intercept unrelated or Alt-modified shortcuts", () => {
    expect(isSaveShortcut({ key: "s", ctrlKey: false, metaKey: false, altKey: false })).toBe(false);
    expect(isSaveShortcut({ key: "s", ctrlKey: true, metaKey: false, altKey: true })).toBe(false);
  });
});
