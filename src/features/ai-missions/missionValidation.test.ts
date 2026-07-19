import { describe, expect, it } from "vitest";

import {
  defaultAiSpeakingMission,
  validateAiSpeakingMission,
} from ".";

describe("validateAiSpeakingMission", () => {
  it.each([
    ["promptLanguage", "   "],
    ["feedbackLanguage", ""],
  ] as const)(
    "rejects a blank %s",
    (field, value) => {
      expect(
        validateAiSpeakingMission({
          ...defaultAiSpeakingMission,
          [field]: value,
        })
      ).toMatchObject({
        ok: false,
      });
    }
  );

  it.each([
    ["missionTitle", 201],
    ["goal", 2001],
    ["promptLanguage", 101],
    ["feedbackLanguage", 101],
    ["readingText", 3001],
    ["teacherInstructions", 5001],
    ["studentInstructions", 5001],
  ] as const)(
    "rejects an oversized %s",
    (field, length) => {
      expect(
        validateAiSpeakingMission({
          ...defaultAiSpeakingMission,
          [field]: "x".repeat(length),
        })
      ).toMatchObject({
        ok: false,
      });
    }
  );

  it("accepts the canonical Lesson 3 configuration", () => {
    expect(
      validateAiSpeakingMission(
        defaultAiSpeakingMission
      )
    ).toMatchObject({
      ok: true,
      value: {
        missionTitle:
          defaultAiSpeakingMission.missionTitle,
        resultFormatVersion: 1,
      },
    });
  });
});
