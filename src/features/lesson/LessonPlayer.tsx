import { useEffect } from "react";

import ActivityRenderer from "../activities/shared/ActivityRenderer";
import LessonNavigator from "./LessonNavigator";
import LessonHeader from "./components/LessonHeader";
import {
  useCallback,
  useState,
} from "react";

import { useLessonState } from "../../shared/hooks/useLessonState";
import { useUserProgress } from "../../shared/hooks/useUserProgress";
import { useUserStats } from "../../shared/hooks/useUserStats";
import { useAchievements } from "../../shared/hooks/useAchievements";

import type { LessonData } from "../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function LessonPlayer({ lesson }: Props) {
  const [activityReadiness, setActivityReadiness] =
    useState<Record<string, boolean>>({});

  const {
    progress: userProgress,
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

  const readinessKey =
    `${lesson.id}-${current}`;

  const requiresAssessment =
    activity.type === "listening" ||
    activity.type === "practice" ||
    activity.type === "quiz";

  const activityPersistedComplete =
    state.completedActivities.includes(
      current
    ) ||
    userProgress.activitiesCompleted.some(
      (item) =>
        item.lessonId === lesson.id &&
        item.activities.includes(current)
    );

  const lessonPersistedComplete =
    userProgress.lessonsCompleted.includes(
      lesson.id
    );

  const activityReady =
    !requiresAssessment ||
    activityReadiness[readinessKey] ===
      true;

  const canCompleteCurrent =
    lessonPersistedComplete ||
    activityPersistedComplete ||
    activityReady;

  const handleReadyChange = useCallback(
    (ready: boolean) => {
      setActivityReadiness((previous) => {
        if (
          previous[readinessKey] === ready
        ) {
          return previous;
        }

        return {
          ...previous,
          [readinessKey]: ready,
        };
      });
    },
    [readinessKey]
  );

  const completed =
    state.completedActivities.length;

  const progress = Math.round(
    (completed / lesson.activities.length) * 100
  );

  function handleNext() {
    if (!canCompleteCurrent) {
      return;
    }

    if (!state.completedActivities.includes(current)) {

      completeActivity(current);

      const activityCompleted =
        saveActivityProgress(
          lesson.id,
          current
        );

      if (
        activityCompleted &&
        !userProgress.lessonsCompleted.includes(
          lesson.id
        )
      ) {
        addXP(10);
      }

    }

    nextActivity();
  }

  function handleFinish() {
    if (!canCompleteCurrent) {
      return;
    }

    completeActivity(current);

    const activityCompleted =
      saveActivityProgress(
        lesson.id,
        current
      );

    const lessonCompleted =
      completeLesson(lesson.id);

    if (lessonCompleted) {
      const activityXP =
        activityCompleted ? 10 : 0;

      const updatedStats =
        addXP(activityXP + 50);

      unlock("first-lesson");

      if (updatedStats.xp >= 100) {
        unlock("100-xp");
      }
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
        onReadyChange={handleReadyChange}
      />

      {!canCompleteCurrent && (
        <p
          role="status"
          className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"
        >
          Submit every question in this activity to continue. Correct answers are not required.
        </p>
      )}

      <LessonNavigator
        current={current}
        total={lesson.activities.length}
        completed={state.completedActivities}
        canAdvance={canCompleteCurrent}
        onPrevious={previousActivity}
        onNext={handleNext}
      />

      {isLastActivity && (
        <button
          type="button"
          onClick={handleFinish}
          disabled={!canCompleteCurrent}
          className="w-full rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Finish Lesson ✓
        </button>
      )}

    </div>
  );
}

export default LessonPlayer;
