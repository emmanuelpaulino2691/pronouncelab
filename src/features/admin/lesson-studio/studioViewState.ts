import type { ActivityType } from "./types";

export type StudioViewMode = "editor" | "split";
export type ActivitySectionCollapseController = {
  canCollapse: boolean;
  disabledReason?: string;
  collapseAll: () => void;
  expandAll: () => void;
};

export function supportsSavedActivityPreview(type: ActivityType) {
  return type !== "interactive_practice";
}

export function savedPreviewNotice(dirty: boolean) {
  return dirty ? "Preview shows the last saved version." : null;
}

export function setRememberedActivityCollapse(current: ReadonlySet<number>, activityId: number, collapsed: boolean) {
  const next = new Set(current);
  if (collapsed) next.add(activityId); else next.delete(activityId);
  return next;
}
