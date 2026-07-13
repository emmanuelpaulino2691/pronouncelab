import { useEffect } from "react";

import ActivityRenderer from "../activities/shared/ActivityRenderer";
import { useLessonState } from "../../shared/hooks/useLessonState";
import { useUserProgress } from "../../shared/hooks/useUserProgress";

import LessonNavigator from "./LessonNavigator";

import type { LessonData } from "../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function LessonPlayer({ lesson }: Props) {
  const {
    startLesson,
    completeLesson,
  } = useUserProgress();

  const {
    state,
    nextActivity,
    previousActivity,
    completeActivity,
  } = useLessonState(lesson.id);

  useEffect(() => {
    startLesson(lesson.id);
  }, [
    lesson.id,
    startLesson,
  ]);

  const activity =
    lesson.activities[state.currentActivity];

  return (
    <div>
      <header>
        <h1 className="text-xl font-bold">
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
        completed={state.completedActivities}
        onPrevious={previousActivity}
        onNext={() => {
          completeActivity(state.currentActivity);
          nextActivity();
        }}
      />

      {state.currentActivity === lesson.activities.length - 1 && (
        <button
          onClick={() => completeLesson(lesson.id)}
          className="mt-4 rounded bg-green-600 px-4 py-2 text-white"
        >
          Complete Lesson
        </button>
      )}
    </div>
  );
}

export default LessonPlayer;