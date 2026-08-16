type HierarchySibling = { id: number; title: string };

export function normalizeHierarchyTitle(title: string) {
  return title.trim().replace(/\s+/gu, " ").toLowerCase();
}

export function hasSiblingTitle(
  siblings: readonly HierarchySibling[],
  title: string,
  excludedId?: number,
) {
  const normalized = normalizeHierarchyTitle(title);
  return siblings.some((sibling) => sibling.id !== excludedId && normalizeHierarchyTitle(sibling.title) === normalized);
}

type DatabaseError = { code?: unknown; message?: unknown };

export function hierarchyTitleSaveError(error: unknown, itemType: "Unit" | "Lesson", title: string) {
  const databaseError = error as DatabaseError | null;
  const message = typeof databaseError?.message === "string" ? databaseError.message : "";
  const constraint = itemType === "Unit" ? "units_course_normalized_title_unique" : "lessons_unit_normalized_title_unique";
  if (databaseError?.code === "23505" && message.includes(constraint)) {
    return `A ${itemType} named '${title.trim()}' already exists in this ${itemType === "Unit" ? "Course" : "Unit"}.`;
  }
  return `The ${itemType.toLowerCase()} could not be saved. Your changes are still here. Try again.`;
}
