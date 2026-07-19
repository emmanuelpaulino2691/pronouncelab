import TheoryRenderer from "../../../shared/components/theory/TheoryRenderer";

import type { LessonData } from "../../../shared/types/LessonData";
import type { LessonActivity } from "../../../shared/types/LessonActivity";

type Props = {
  activity?: LessonActivity;
  lesson: LessonData;
  onReadyChange?: (ready: boolean) => void;
};

function TheoryActivity({ lesson }: Props) {
  return (
    <TheoryRenderer
      blocks={lesson.theory}
    />
  );
}

export default TheoryActivity;
