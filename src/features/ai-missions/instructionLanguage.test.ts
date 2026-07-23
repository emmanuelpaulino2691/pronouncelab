import { describe, expect, it } from "vitest";

import { generateAiMissionPrompt } from "./promptGenerator";
import {
  getStudentInstructions,
  hasSpanishStudentInstructions,
} from "./instructionLanguage";
import { defaultAiSpeakingMission } from "./types";

describe("AI mission student instruction languages", () => {
  const bilingual = {
    ...defaultAiSpeakingMission,
    studentInstructions: "Follow the English workflow.",
    studentInstructionsEs: "Sigue el proceso en español.",
  };

  it("does not offer Spanish when no Spanish instructions exist", () => {
    expect(hasSpanishStudentInstructions(defaultAiSpeakingMission)).toBe(false);
  });

  it("uses English by default and can switch in both directions", () => {
    expect(getStudentInstructions(bilingual, "en")).toBe(
      "Follow the English workflow."
    );
    expect(getStudentInstructions(bilingual, "es")).toBe(
      "Sigue el proceso en español."
    );
    expect(getStudentInstructions(bilingual, "en")).toBe(
      "Follow the English workflow."
    );
  });

  it("does not change the generated AI prompt", () => {
    expect(generateAiMissionPrompt(bilingual)).toBe(
      generateAiMissionPrompt(defaultAiSpeakingMission)
    );
  });
});
