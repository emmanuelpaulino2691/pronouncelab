import { describe, expect, it } from "vitest";

import { findAiMissionForActivity } from "./missionAssociation";
import {
  defaultAiSpeakingMission,
  type AiSpeakingMission,
} from "./types";

function mission(
  activityId: number,
  missionTitle: string
): AiSpeakingMission {
  return {
    ...defaultAiSpeakingMission,
    activityId,
    missionTitle,
  };
}

describe("findAiMissionForActivity", () => {
  const missions = [
    mission(5, "First mission"),
    mission(8, "Second mission"),
  ];

  it("returns the mission associated with the current activity", () => {
    expect(
      findAiMissionForActivity(missions, 8)
        ?.missionTitle
    ).toBe("Second mission");
  });

  it("does not fall back to another activity's mission", () => {
    expect(
      findAiMissionForActivity(missions, 99)
    ).toBeUndefined();
  });
});
