import type { ActivityType } from "./types";

export type StudioViewMode = "editor" | "split";
export type ActivitySectionCollapseController = {
  canCollapse: boolean;
  supportsSectionCollapse: boolean;
  sectionCount: number;
  collapsedSectionCount: number;
  disabledReason?: string;
  collapseAll: () => void;
  expandAll: () => void;
};

export function collapseEverySection(sectionIds: readonly string[]) {
  return new Set(sectionIds);
}

export function toggleCollapsedSection(current: ReadonlySet<string>, sectionId: string) {
  const next = new Set(current);
  if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
  return next;
}

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
