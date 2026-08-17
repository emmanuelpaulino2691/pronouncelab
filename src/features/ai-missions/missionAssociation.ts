import type { AiSpeakingMission } from "./types";

export function findAiMissionForActivity(
  missions: readonly AiSpeakingMission[] | undefined,
  activityId: number
) {
  return missions?.find(
    (mission) => mission.activityId === activityId
  );
}
