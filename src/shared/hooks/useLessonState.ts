import { useEffect, useState } from "react";

import {
  clearLessonState,
  loadLessonState,
  saveLessonState,
} from "../utils/lessonStorage";
import { normalizeLessonState } from "../../features/lesson/studentExperience";

export function useLessonState(
  lessonId: number,
  totalActivities: number
) {
  const [state, setState] = useState(() => {
    return normalizeLessonState(loadLessonState(lessonId), totalActivities);
  });

  useEffect(() => {
    saveLessonState(lessonId, state);
  }, [lessonId, state]);

  const nextActivity = () => {
    setState((previous) => ({
      ...previous,
      currentActivity: Math.min(
        previous.currentActivity + 1,
        totalActivities - 1
      ),
    }));
  };

  const previousActivity = () => {
    setState((previous) => ({
      ...previous,
      currentActivity: Math.max(
        previous.currentActivity - 1,
        0
      ),
    }));
  };

  const completeActivity = (
    activityIndex: number
  ) => {
    setState((previous) => ({
      ...previous,
      completedActivities:
        previous.completedActivities.includes(
          activityIndex
        )
          ? previous.completedActivities
          : [
              ...previous.completedActivities,
              activityIndex,
            ].sort((a, b) => a - b),
    }));
  };

  const goToActivity = (activityIndex: number) => {
    setState((previous) => ({
      ...previous,
      currentActivity: Math.min(Math.max(activityIndex, 0), Math.max(totalActivities - 1, 0)),
    }));
  };

  const restartLesson = () => {
    clearLessonState(lessonId);
    setState({ currentActivity: 0, completedActivities: [] });
  };

  const reviewLesson = () => {
    setState((previous) => ({ ...previous, currentActivity: 0 }));
  };

  const isFirstActivity =
    state.currentActivity === 0;

  const isLastActivity =
    state.currentActivity ===
    totalActivities - 1;

  return {
    state,
    nextActivity,
    previousActivity,
    completeActivity,
    goToActivity,
    restartLesson,
    reviewLesson,
    isFirstActivity,
    isLastActivity,
  };
}
