import AiSpeakingMissionCard from "../../ai-missions/AiSpeakingMissionCard";
import { findAiMissionForActivity } from "../../ai-missions";
import type { LessonActivity } from "../../../shared/types/LessonActivity";
import type { LessonData } from "../../../shared/types/LessonData";

export default function AiSpeakingMissionActivity({
  activity,
  lesson,
  onReadyChange,
}: {
  activity: LessonActivity;
  lesson: LessonData;
  onReadyChange?: (ready: boolean) => void;
}) {
  const mission = findAiMissionForActivity(
    lesson.aiMissions,
    activity.id
  );
  if (!mission) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">This AI speaking mission is not available yet.</div>;
  }
  return <AiSpeakingMissionCard mission={mission} onConfirmed={() => onReadyChange?.(true)} />;
}
