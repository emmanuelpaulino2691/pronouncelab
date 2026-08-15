import { describe, expect, it } from "vitest";
import {
  assignmentActionLabel,
  assignmentCompletionSummary,
  assignmentCourseStatus,
  assignmentDeactivationConfirmation,
  classArchiveConfirmation,
  joinCodeRegenerationConfirmation,
  newerReleaseNumber,
  orderAssignmentHistory,
} from "./assignmentPresentation";
import type { AssignmentProgress, ClassCourseAssignment } from "./classService";

const assignment = (overrides: Partial<ClassCourseAssignment> = {}): ClassCourseAssignment => ({ assignmentId:1,classId:2,releaseId:3,courseId:4,courseTitle:"Vowels",courseDescription:"",courseLevel:"A1",releaseNumber:1,latestReleaseNumber:1,assignedAt:"2026-08-10T12:00:00Z",endedAt:null,status:"active",...overrides });

describe("assignment lifecycle presentation", () => {
  it("classifies Release-only learner progress", () => {
    expect(assignmentCourseStatus(0, 5)).toBe("not-started");
    expect(assignmentCourseStatus(2, 5)).toBe("in-progress");
    expect(assignmentCourseStatus(5, 5)).toBe("completed");
    expect(assignmentActionLabel("completed")).toBe("Review Course");
  });
  it("shows newer Releases only when appropriate", () => {
    expect(newerReleaseNumber(assignment())).toBeNull();
    expect(newerReleaseNumber(assignment({ latestReleaseNumber:2 }))).toBe(2);
  });
  it("orders preserved assignment history newest first", () => {
    const rows = orderAssignmentHistory([assignment(), assignment({ assignmentId:2, assignedAt:"2026-08-14T12:00:00Z" })]);
    expect(rows.map((row) => row.assignmentId)).toEqual([2, 1]);
  });
  it("summarizes completed learners without unrelated progress", () => {
    const report: AssignmentProgress = { assignmentId:1,releaseId:3,courseTitle:"Vowels",releaseNumber:1,totalLessons:5,learners:[{learnerId:"a",email:"a@example.com",startedLessons:5,completedLessons:5,completionPercent:100,lastAccessedAt:null},{learnerId:"b",email:"b@example.com",startedLessons:2,completedLessons:2,completionPercent:40,lastAccessedAt:null}] };
    expect(assignmentCompletionSummary(report)).toBe("1 of 2 learners completed");
  });
  it("explains preservation and revocation before lifecycle actions", () => {
    expect(assignmentDeactivationConfirmation).toContain("progress is preserved");
    expect(classArchiveConfirmation).toContain("progress are preserved");
    expect(joinCodeRegenerationConfirmation).toContain("current code will stop working");
  });
});
