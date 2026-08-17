import ListeningCard from "../../../shared/components/listening/ListeningCard";
import { useAssessmentReadiness } from "../../../shared/hooks/useAssessmentReadiness";

import type { LessonData } from "../../../shared/types/LessonData";
import type { LessonActivity } from "../../../shared/types/LessonActivity";

type Props = {
  activity?: LessonActivity;
  lesson: LessonData;
  onReadyChange?: (ready: boolean) => void;
};

function ListeningActivity({
  lesson,
  onReadyChange,
}: Props) {
  const listeningItems =
    lesson.listening ?? [];

  const requiredKeys = listeningItems.flatMap(
    (item, index) =>
      item.questions &&
      item.questions.length > 0
        ? [`listening-${index}`]
        : []
  );

  const setItemReady =
    useAssessmentReadiness(
      requiredKeys,
      onReadyChange
    );

  return (
    <div className="space-y-4">
      {listeningItems.map((item, index) => (
        <ListeningCard
          key={index}
          listening={item}
          onReadyChange={(ready) =>
            setItemReady(
              `listening-${index}`,
              ready
            )
          }
        />
      ))}
    </div>
  );
}

export default ListeningActivity;
