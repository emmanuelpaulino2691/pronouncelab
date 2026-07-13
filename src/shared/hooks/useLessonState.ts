import { useEffect, useState } from "react";

import { loadLessonState, saveLessonState } from "../utils/lessonStorage";

import type { LessonState } from "../types/LessonState";

export function useLessonState(lessonId: number) {
  const [state, setState] = useState<LessonState>(() => {
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
      currentActivity: previous.currentActivity + 1,
    }));
  };

  const previousActivity = () => {
    setState((previous) => ({
      ...previous,
      currentActivity: Math.max(
        0,
        previous.currentActivity - 1
      ),
    }));
  };

  const completeActivity = (activityIndex: number) => {
  setState((previous) => ({
    ...previous,
    completedActivities: previous.completedActivities.includes(
      activityIndex
    )
      ? previous.completedActivities
      : [
          ...previous.completedActivities,
          activityIndex,
        ].sort((a, b) => a - b),
  }));
};

  return {
    state,
    nextActivity,
    previousActivity,
    completeActivity,
  };
}