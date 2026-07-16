import { useEffect } from "react";

import ActivityRenderer from "../activities/shared/ActivityRenderer";
import LessonNavigator from "./LessonNavigator";
import LessonHeader from "./components/LessonHeader";

import { useLessonState } from "../../shared/hooks/useLessonState";
import { useUserProgress } from "../../shared/hooks/useUserProgress";
import { useUserStats } from "../../shared/hooks/useUserStats";
import { useAchievements } from "../../shared/hooks/useAchievements";

import type { LessonData } from "../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function LessonPlayer({ lesson }: Props) {

  const {
    startLesson,
    completeLesson,
    completeActivity: saveActivityProgress,
  } = useUserProgress();

  const { stats, addXP } = useUserStats();

  const { unlock } = useAchievements();

  const {
    state,
    nextActivity,
    previousActivity,
    completeActivity,
    isLastActivity,
  } = useLessonState(
    lesson.id,
    lesson.activities.length
  );

  useEffect(() => {
    startLesson(lesson.id);
  }, [lesson.id, startLesson]);

  const current = state.currentActivity;

  const activity = lesson.activities[current];

  const completed =
    state.completedActivities.length;

  const progress = Math.round(
    (completed / lesson.activities.length) * 100
  );

  function handleNext() {

    if (!state.completedActivities.includes(current)) {

      completeActivity(current);

      saveActivityProgress(
        lesson.id,
        current
      );

      addXP(10);

    }

    nextActivity();
  }

  function handleFinish() {

    completeLesson(lesson.id);

    addXP(50);

    unlock("first-lesson");

    if (stats.xp + 50 >= 100) {
      unlock("100-xp");
    }

  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      <LessonHeader
        title={lesson.title}
        description={lesson.description}
        activity={activity.title}
        current={current + 1}
        total={lesson.activities.length}
        progress={progress}
      />

      <div className="flex justify-end">
        <div className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
          ⭐ Level {stats.level} • {stats.xp} XP
        </div>
      </div>

      <ActivityRenderer
        activity={activity}
        lesson={lesson}
      />

      <LessonNavigator
        current={current}
        total={lesson.activities.length}
        completed={state.completedActivities}
        onPrevious={previousActivity}
        onNext={handleNext}
      />

      {isLastActivity && (
        <button
          onClick={handleFinish}
          className="w-full rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          Finish Lesson ✓
        </button>
      )}

    </div>
  );
}

export default LessonPlayer;
