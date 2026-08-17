import type { LearnerAssignmentSnapshot } from "../classes/learnerClassWorkspace";
import type { LearnerCourseJourney } from "../learner-journey/learnerJourney";

export type ClassProgressItem = {
  key: string;
  className: string;
  courseTitle: string;
  completed: number;
  total: number;
  percent: number;
  href: string;
};

export type IndependentProgressItem = {
  courseTitle: string;
  completed: number;
  total: number;
  percent: number;
  href: string;
};

export function presentClassProgress(assignments: readonly LearnerAssignmentSnapshot[]): ClassProgressItem[] {
  return assignments.map((item) => ({
    key: `${item.classId}:${item.assignmentId}`,
    className: item.className,
    courseTitle: item.courseTitle,
    completed: item.navigation.completed,
    total: item.navigation.total,
    percent: item.navigation.percent,
    href: `/releases/${item.releaseId}?classId=${item.classId}`,
  }));
}

export function presentIndependentProgress(journeys: readonly LearnerCourseJourney[]): IndependentProgressItem[] {
  return journeys.filter((item) => item.state !== "not_started" && item.state !== "empty").map((item) => ({
    courseTitle: item.course.title,
    completed: item.completedLessons,
    total: item.totalLessons,
    percent: item.percent,
    href: `/courses/${item.course.id}`,
  }));
}
