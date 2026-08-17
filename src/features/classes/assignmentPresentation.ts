import type { AssignmentProgress, ClassCourseAssignment } from "./classService";

export type AssignmentCourseStatus = "not-started" | "in-progress" | "completed";

export function assignmentCourseStatus(completedLessons: number, totalLessons: number): AssignmentCourseStatus {
  if (totalLessons > 0 && completedLessons >= totalLessons) return "completed";
  if (completedLessons > 0) return "in-progress";
  return "not-started";
}

export function assignmentStatusLabel(status: AssignmentCourseStatus) {
  if (status === "completed") return "Completed";
  if (status === "in-progress") return "In progress";
  return "Not started";
}

export function assignmentActionLabel(status: AssignmentCourseStatus) {
  return status === "completed" ? "Review Course" : "Open Course";
}

export function newerReleaseNumber(assignment: ClassCourseAssignment) {
  return assignment.latestReleaseNumber > assignment.releaseNumber ? assignment.latestReleaseNumber : null;
}

export function orderAssignmentHistory(assignments: readonly ClassCourseAssignment[]) {
  return [...assignments].sort((left, right) => Date.parse(right.assignedAt) - Date.parse(left.assignedAt));
}

export function assignmentDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function assignmentCompletionSummary(report: AssignmentProgress | undefined) {
  if (!report) return "Load progress to see learner completion";
  const completed = report.learners.filter((learner) => assignmentCourseStatus(learner.completedLessons, report.totalLessons) === "completed").length;
  return `${completed} of ${report.learners.length} learners completed`;
}

export const assignmentDeactivationConfirmation = "Learners will lose access through this Class. Their progress is preserved, and this assignment remains in history. Remove this assignment?";
export const classArchiveConfirmation = "Archiving stops Class access and joining. Enrollments, assignments, and learner progress are preserved. Archive this Class?";
export const joinCodeRegenerationConfirmation = "Create a new join code? The current code will stop working immediately. Existing learners remain enrolled.";
export const releaseUpdateProgressExplanation = "Updating starts separate Class Progress for the new immutable Release. Existing Release progress and assignment history remain preserved.";
