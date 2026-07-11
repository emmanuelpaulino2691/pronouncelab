import { useState } from "react";

import type { LessonState } from "../types/LessonState";

export function useLessonState() {
  const [state, setState] = useState<LessonState>({
    currentActivity: 0,
  });

  const nextActivity = () => {
    setState((previous) => ({
      ...previous,
      currentActivity: previous.currentActivity + 1,
    }));
  };

  const previousActivity = () => {
    setState((previous) => ({
      ...previous,
      currentActivity: Math.max(0, previous.currentActivity - 1),
    }));
  };

  return {
    state,
    nextActivity,
    previousActivity,
  };
}