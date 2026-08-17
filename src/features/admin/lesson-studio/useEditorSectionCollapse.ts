import { useEffect, useMemo, useState } from "react";
import { collapseEverySection, toggleCollapsedSection, type ActivitySectionCollapseController } from "./studioViewState";

export function useEditorSectionCollapse(activityId: number, sectionIds: readonly string[], onControllerChange?: (controller: ActivitySectionCollapseController | null) => void) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const signature = sectionIds.join("|");
  const stableIds = useMemo(() => [...sectionIds], [signature]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!onControllerChange) return;
    onControllerChange({
      canCollapse: stableIds.length > 0,
      supportsSectionCollapse: stableIds.length > 0,
      sectionCount: stableIds.length,
      collapsedSectionCount: stableIds.filter((id) => collapsed.has(id)).length,
      disabledReason: stableIds.length ? undefined : "This activity has no sections to collapse.",
      collapseAll: () => setCollapsed(collapseEverySection(stableIds)),
      expandAll: () => setCollapsed(new Set()),
    });
    return () => onControllerChange(null);
  }, [activityId, collapsed, onControllerChange, stableIds]);
  return { collapsed, toggle: (sectionId: string) => setCollapsed((current) => toggleCollapsedSection(current, sectionId)) };
}
