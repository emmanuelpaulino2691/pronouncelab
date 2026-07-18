import AiSpeakingMissionCard from "../../ai-missions/AiSpeakingMissionCard";
import type { LessonData } from "../../../shared/types/LessonData";

export default function AiSpeakingMissionActivity({
  lesson,
  onReadyChange,
}: {
  lesson: LessonData;
  onReadyChange?: (ready: boolean) => void;
}) {
  const mission = lesson.aiMissions?.[0];
  if (!mission) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">This AI speaking mission is not available yet.</div>;
  }
  return <AiSpeakingMissionCard mission={mission} onConfirmed={() => onReadyChange?.(true)} />;
}
