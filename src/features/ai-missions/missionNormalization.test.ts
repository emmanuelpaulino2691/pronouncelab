import { describe, expect, it } from "vitest";

import { normalizeAiSpeakingMission } from "./missionNormalization";
import { defaultAiSpeakingMission } from "./types";

describe("normalizeAiSpeakingMission", () => {
  it("preserves and trims Spanish instructions for editor saves", () => {
    expect(
      normalizeAiSpeakingMission({
        ...defaultAiSpeakingMission,
        studentInstructionsEs: "  Sigue estos pasos.  ",
      }).studentInstructionsEs
    ).toBe("Sigue estos pasos.");
  });

  it("omits whitespace-only optional Spanish instructions", () => {
    expect(
      normalizeAiSpeakingMission({
        ...defaultAiSpeakingMission,
        studentInstructionsEs: "   ",
      }).studentInstructionsEs
    ).toBeUndefined();
  });
});
