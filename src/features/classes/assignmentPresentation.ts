import type { AssignmentProgress, ClassCourseAssignment } from "./classService";

export type AssignmentCourseStatus = "not-started" | "in-progress" | "completed";
export type AssignmentScheduleStatus = "upcoming" | "not-started" | "in-progress" | "completed" | "late";

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

export function assignmentScheduleStatus(completedLessons: number, totalLessons: number, availableAt: string|null|undefined, dueAt: string|null|undefined, now = new Date()): AssignmentScheduleStatus {
  if (availableAt && Date.parse(availableAt) > now.getTime()) return "upcoming";
  if (totalLessons > 0 && completedLessons >= totalLessons) return "completed";
  if (dueAt && Date.parse(dueAt) < now.getTime()) return "late";
  return completedLessons > 0 ? "in-progress" : "not-started";
}

export function assignmentScheduleLabel(status: AssignmentScheduleStatus) {
  if (status === "upcoming") return "Upcoming";
  if (status === "late") return "Late";
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

export function assignmentDateTime(value: string|null|undefined, timezone = "UTC") {
  if (!value) return "No date set";
  try { return new Intl.DateTimeFormat(undefined, { dateStyle:"medium", timeStyle:"short", timeZone:timezone }).format(new Date(value)); }
  catch { return assignmentDate(value); }
}

export function assignmentLocalInputToUtc(value: string, timezone = "UTC") {
  if (!value) return null;
  const naive = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(naive)) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour12: false, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit" }).formatToParts(new Date(naive));
    const get = (type:string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const represented = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
    return new Date(naive - (represented - naive)).toISOString();
  } catch { return new Date(naive).toISOString(); }
}

export function assignmentUtcToLocalInput(value: string|null|undefined, timezone = "UTC") {
  if (!value) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, hour12: false, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" }).formatToParts(new Date(value));
    const get = (type:string) => parts.find((part) => part.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")==="24"?"00":get("hour")}:${get("minute")}`;
  } catch { return value.slice(0,16); }
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
