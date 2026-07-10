import TheoryRenderer from "../../../shared/components/theory/TheoryRenderer";

import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function TheoryActivity({ lesson }: Props) {
  return (
    <>
      <h1 className="text-3xl font-bold">{lesson.title}</h1>

      <TheoryRenderer blocks={lesson.theory} />
    </>
  );
}

export default TheoryActivity;