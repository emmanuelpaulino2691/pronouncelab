import PracticeCard from "../../../shared/components/practice/PracticeCard";

import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function PracticeActivity({ lesson }: Props) {
  return (
    <div className="space-y-4">
      {(lesson.practice ?? []).map((practice, index) => (
        <PracticeCard
          key={index}
          practice={practice}
        />
      ))}
    </div>
  );
}

export default PracticeActivity;
