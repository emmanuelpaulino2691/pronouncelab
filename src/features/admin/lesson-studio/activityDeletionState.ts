import type { LessonActivity } from "./types";

export function removeActivityAndSelectNearest(
  activities: readonly LessonActivity[],
  deletedActivityId: number,
  selectedActivityId: number | null
) {
  const deletedIndex = activities.findIndex(
    (activity) => activity.id === deletedActivityId
  );
  const remaining = activities.filter(
    (activity) => activity.id !== deletedActivityId
  );

  if (selectedActivityId !== deletedActivityId) {
    return { activities: remaining, selectedActivityId };
  }

  const nearestIndex = Math.min(
    Math.max(deletedIndex, 0),
    remaining.length - 1
  );

  return {
    activities: remaining,
    selectedActivityId:
      nearestIndex >= 0 ? remaining[nearestIndex].id : null,
  };
}
