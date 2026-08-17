import type { LearnerAssignmentSnapshot } from "../classes/learnerClassWorkspace";

export type HomeAssignment = LearnerAssignmentSnapshot;
export function isAssignmentUpcoming(item: HomeAssignment) { return Boolean(item.availableAt && Date.parse(item.availableAt) > Date.now()); }

export function orderHomeAssignments(items: readonly HomeAssignment[]) {
  return [...items].filter((item) => !item.navigation.complete && !isAssignmentUpcoming(item)).sort((left, right) => {
    const leftStarted = left.navigation.completed > 0 || left.lastAccessedAt !== null;
    const rightStarted = right.navigation.completed > 0 || right.lastAccessedAt !== null;
    return Number(rightStarted) - Number(leftStarted)
      || (right.lastAccessedAt ?? "").localeCompare(left.lastAccessedAt ?? "")
      || left.assignedAt.localeCompare(right.assignedAt)
      || left.assignmentId - right.assignmentId;
  });
}

export function selectHomeAssignment(items: readonly HomeAssignment[]) {
  return orderHomeAssignments(items)[0] ?? null;
}

export function homeEmptyState(membershipCount: number, assignmentCount: number) {
  if (membershipCount === 0) return "no-classes" as const;
  if (assignmentCount === 0) return "no-assignments" as const;
  return "all-complete" as const;
}
