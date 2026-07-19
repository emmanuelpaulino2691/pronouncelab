import { describe, expect, it } from "vitest";

import { parseAiMissionResult } from "./resultParser";

function validResult(score = "85") {
  return `PRONOUNCELAB MISSION RESULT
Format Version: 1
Mission: Short I and Long E Mission
Overall Pronunciation Score: ${score}
Words to Practice Again: ship, sit
Pronunciation Feedback: Keep the short sound relaxed.
Strengths:
- Clear long E sound
• Patient repetition
Goal for Next Practice: Contrast ship and sheep.
Coach Message: Good focused practice.`;
}

describe("parseAiMissionResult", () => {
  it("parses a complete Format Version 1 result", () => {
    const result = parseAiMissionResult(
      validResult()
    );

    expect(result.formatVersion).toBe(1);
    expect(result.score).toBe(85);
    expect(result.wordsToPracticeAgain).toEqual([
      "ship",
      "sit",
    ]);
    expect(result.strengths).toEqual([
      "Clear long E sound",
      "Patient repetition",
    ]);
    expect(result.warnings).toEqual([]);
  });

  it.each(["85", "85%", "85/100"])(
    "accepts the supported score format %s",
    (score) => {
      expect(
        parseAiMissionResult(validResult(score))
          .score
      ).toBe(85);
    }
  );

  it.each([
    "85/90",
    "85 and 40",
    "85% 200",
    "Score: 85",
    "85.0",
    "085",
    "-1",
    "101",
  ])(
    "rejects the ambiguous or invalid score %s",
    (score) => {
      const result = parseAiMissionResult(
        validResult(score)
      );

      expect(result.score).toBeNull();
      expect(result.warnings).toContain(
        "The pronunciation score must use 85, 85%, or 85/100 format and be between 0–100."
      );
    }
  );

  it("keeps the first recognized section and warns about duplicates", () => {
    const result = parseAiMissionResult(
      `${validResult()}
Pronunciation Feedback: Replaced feedback`
    );

    expect(result.pronunciationFeedback).toBe(
      "Keep the short sound relaxed."
    );
    expect(result.warnings).toContain(
      "Duplicate section ignored: Pronunciation Feedback."
    );
  });

  it("warns when required sections are missing", () => {
    const result = parseAiMissionResult(
      `PRONOUNCELAB MISSION RESULT
Format Version: 1
Mission: Short I Mission
Overall Pronunciation Score: 85`
    );

    expect(result.warnings).toContain(
      "Missing or empty section: Coach Message."
    );
    expect(result.warnings).toContain(
      "Missing or empty section: Strengths."
    );
  });
});
