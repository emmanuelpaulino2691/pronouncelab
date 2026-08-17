import PracticeCard from "../../../shared/components/practice/PracticeCard";
import { useAssessmentReadiness } from "../../../shared/hooks/useAssessmentReadiness";

import type { LessonData } from "../../../shared/types/LessonData";
import type { LessonActivity } from "../../../shared/types/LessonActivity";

type Props = {
  activity?: LessonActivity;
  lesson: LessonData;
  onReadyChange?: (ready: boolean) => void;
};

function PracticeActivity({
  lesson,
  onReadyChange,
}: Props) {
  const practiceItems =
    lesson.practice ?? [];

  const requiredKeys = practiceItems.flatMap(
    (practice, index) =>
      practice.questions &&
      practice.questions.length > 0
        ? [`practice-${index}`]
        : []
  );

  const setItemReady =
    useAssessmentReadiness(
      requiredKeys,
      onReadyChange
    );

  return (
    <div className="space-y-4">
      {practiceItems.map((practice, index) => (
        <PracticeCard
          key={index}
          practice={practice}
          onReadyChange={(ready) =>
            setItemReady(
              `practice-${index}`,
              ready
            )
          }
        />
      ))}
    </div>
  );
}

export default PracticeActivity;
