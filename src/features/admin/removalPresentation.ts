type RemovableHierarchyItem = { title: string; status: string };

export function courseRemovalDescription(item: RemovableHierarchyItem) {
  return item.status === "draft"
    ? `Delete “${item.title}” and its draft curriculum?`
    : `Retire “${item.title}”? It will leave active authoring and independent practice. Existing Class Assignments, published content, and learner history remain available.`;
}

export function unitRemovalDescription(item: RemovableHierarchyItem) {
  return item.status === "draft"
    ? `Delete “${item.title}” and its draft Lessons?`
    : `Delete “${item.title}”? Its Lessons will be removed from the next Course update. Existing published content and learner history remain unchanged.`;
}

export function lessonRemovalDescription(item: RemovableHierarchyItem) {
  return item.status === "draft"
    ? `Delete “${item.title}” and its draft content?`
    : `Delete “${item.title}”? It will be removed from the next published Course update. Existing published content and learner history will not be changed.`;
}

export function isActiveAuthoringCourse(status: string) {
  return status !== "archived";
}
