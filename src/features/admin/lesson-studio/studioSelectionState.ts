import type { LessonActivity } from "./types";

export function reconcileSelectedActivityId(
  currentId: number | null,
  activities: readonly Pick<LessonActivity, "id">[]
): number | null {
  if (currentId !== null && activities.some((activity) => activity.id === currentId)) {
    return currentId;
  }
  return activities[0]?.id ?? null;
}

export function shouldWarnBeforeUnload(isDirty: boolean): boolean {
  return isDirty;
}

export function canDiscardDirtyEditor(isDirty: boolean, confirmDiscard: () => boolean): boolean {
  return !isDirty || confirmDiscard();
}
