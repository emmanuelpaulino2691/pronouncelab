import { describe, expect, it } from "vitest";

import { generateAiMissionPrompt } from "./promptGenerator";
import { defaultAiSpeakingMission } from "./types";

describe("generateAiMissionPrompt", () => {
  it("includes the configured mission and Format Version 1 result contract", () => {
    const prompt = generateAiMissionPrompt(
      defaultAiSpeakingMission
    );

    expect(prompt).toContain(
      defaultAiSpeakingMission.missionTitle
    );
    expect(prompt).toContain(
      `Guide a ${defaultAiSpeakingMission.cefrLevel} learner`
    );
    expect(prompt).toContain(
      "PRONOUNCELAB MISSION RESULT"
    );
    expect(prompt).toContain("Format Version: 1");
    expect(prompt).toContain(
      "Overall Pronunciation Score: [0-100]"
    );
    expect(prompt).toContain(
      "Do not claim perfect accuracy."
    );
  });

  it("omits Sound group B when no contrast words are configured", () => {
    const prompt = generateAiMissionPrompt({
      ...defaultAiSpeakingMission,
      secondarySoundLabel: "",
      secondarySoundIpa: "",
      secondaryWords: [],
    });

    expect(prompt).not.toContain(
      "Sound group B —"
    );
    expect(prompt).toContain(
      "Review the target sound."
    );
  });
});
