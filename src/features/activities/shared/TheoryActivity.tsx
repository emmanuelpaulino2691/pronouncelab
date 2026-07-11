import TheoryRenderer from "../../../shared/components/theory/TheoryRenderer";

import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function TheoryActivity({ lesson }: Props) {
  return <TheoryRenderer blocks={lesson.theory} />;
}

export default TheoryActivity;