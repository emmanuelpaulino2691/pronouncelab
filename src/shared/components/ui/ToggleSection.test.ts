import { describe, expect, it } from "vitest";

import {
  getToggleSectionLabel,
  toggleSectionButtonType,
} from "./toggleSectionState";

describe("ToggleSection", () => {
  it("provides clear closed and open transcript labels", () => {
    expect(getToggleSectionLabel(false, "Show transcript", "Hide transcript")).toBe("Show transcript");
    expect(getToggleSectionLabel(true, "Show transcript", "Hide transcript")).toBe("Hide transcript");
  });

  it("never submits a surrounding form", () => {
    expect(toggleSectionButtonType).toBe("button");
  });
});
