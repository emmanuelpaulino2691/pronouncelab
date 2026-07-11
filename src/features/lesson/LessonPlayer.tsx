import ActivityRenderer from "../activities/shared/ActivityRenderer";
import { useLessonState } from "../../shared/hooks/useLessonState";

import LessonNavigator from "./LessonNavigator";

import type { LessonData } from "../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function LessonPlayer({ lesson }: Props) {
  const {
    state,
    nextActivity,
    previousActivity,
  } = useLessonState();

  const activity = lesson.activities[state.currentActivity];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">
          {lesson.title}
        </h1>

        <p className="mt-2 text-slate-600">
          {lesson.description}
        </p>
      </header>

      <ActivityRenderer
        activity={activity}
        lesson={lesson}
      />

      <LessonNavigator
        current={state.currentActivity}
        total={lesson.activities.length}
        onPrevious={previousActivity}
        onNext={nextActivity}
      />
    </div>
  );
}

export default LessonPlayer;