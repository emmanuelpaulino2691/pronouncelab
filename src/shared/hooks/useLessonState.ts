import { useEffect, useState } from "react";

import {
  loadLessonState,
  saveLessonState,
} from "../utils/lessonStorage";

export function useLessonState(
  lessonId: number,
  totalActivities: number
) {
  const [state, setState] = useState(() => {
    return (
      loadLessonState(lessonId) ?? {
        currentActivity: 0,
        completedActivities: [],
      }
    );
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
    isFirstActivity,
    isLastActivity,
  };
}
