import type { LearnerCourse } from "../../shared/content/contracts/learnerContent";
import { isUsableLearnerLesson, resolveRecommendedLearnerStep, type RecommendedLearnerStep } from "../learner-journey/learnerJourney";

type LocalProgress = {
  lessonsStarted: readonly string[];
  lessonsCompleted: readonly string[];
  activitiesCompleted: readonly { lessonId: string; activities: readonly number[] }[];
};

export type NextLearnerAction = RecommendedLearnerStep;

export type CurrentCourseSummary = {
  courseId: string;
  courseTitle: string;
  unitTitle: string;
  completedLessons: number;
  totalLessons: number;
  percent: number;
};

export type LearnerDashboardProgress = {
  completedLessons: number;
  totalLessons: number;
  completedCourses: number;
};

function availableLessons(courses: readonly LearnerCourse[]) {
  return courses.flatMap((course) => course.units.flatMap((unit) => unit.lessons.filter(isUsableLearnerLesson).map((lesson) => ({ course, unit, lesson }))));
}

export function resolveNextLearnerAction(courses: readonly LearnerCourse[], progress: LocalProgress, resumedActivityByLesson: Readonly<Record<string, number>> = {}): NextLearnerAction | null {
  return resolveRecommendedLearnerStep(courses, progress, resumedActivityByLesson);
}

export function buildCurrentCourseSummary(action: NextLearnerAction, progress: LocalProgress): CurrentCourseSummary {
  const lessonIds = action.course.units.flatMap((unit) => unit.lessons.filter(isUsableLearnerLesson).map((lesson) => lesson.id));
  const completed = new Set<string>(progress.lessonsCompleted);
  const completedLessons = lessonIds.filter((id) => completed.has(id)).length;
  return { courseId: action.course.id, courseTitle: action.course.title, unitTitle: action.unit.title, completedLessons, totalLessons: lessonIds.length, percent: lessonIds.length ? Math.round(completedLessons / lessonIds.length * 100) : 0 };
}

export function calculateLearnerDashboardProgress(courses: readonly LearnerCourse[], progress: LocalProgress): LearnerDashboardProgress {
  const completed = new Set<string>(progress.lessonsCompleted);
  const courseLessonIds = courses.map((course) => course.units.flatMap((unit) => unit.lessons.filter(isUsableLearnerLesson).map((lesson) => lesson.id)));
  const allLessonIds = courseLessonIds.flat();
  return { completedLessons: allLessonIds.filter((id) => completed.has(id)).length, totalLessons: allLessonIds.length, completedCourses: courseLessonIds.filter((ids) => ids.length > 0 && ids.every((id) => completed.has(id))).length };
}

export function nextActionLabel(kind: NextLearnerAction["kind"]) {
  return kind === "continue" ? "Continue Learning" : kind === "review" ? "Review Lesson" : "Start Learning";
}

export function hasLearnerProgress(progress: LocalProgress) {
  return progress.lessonsStarted.length > 0 || progress.lessonsCompleted.length > 0 || progress.activitiesCompleted.some((item) => item.activities.length > 0);
}

export function hasCompletedEveryAvailableLesson(courses: readonly LearnerCourse[], progress: LocalProgress) {
  const lessons = availableLessons(courses);
  if (!lessons.length) return false;
  const completed = new Set<string>(progress.lessonsCompleted);
  return lessons.every(({ lesson }) => completed.has(lesson.id));
}

export type MissionPresentation = { introduction: string; heading: string };

export function getHomeWelcomeHeading(firstName?: string | null) {
  const safeName = firstName?.trim();
  return safeName ? `Welcome back, ${safeName}!` : "Welcome back!";
}

export function getMissionPresentation(action: NextLearnerAction, returningLearner: boolean, everythingCompleted: boolean): MissionPresentation {
  if (everythingCompleted) return { introduction: "Every available lesson is complete.", heading: "Great work!" };
  if (action.kind === "continue") return { introduction: "Continue where you left off.", heading: action.lesson.title };
  if (action.kind === "review") return { introduction: "Strengthen what you learned.", heading: action.lesson.title };
  return { introduction: returningLearner ? "Your next lesson is ready." : "Your English journey starts here.", heading: action.lesson.title };
}

export const homeSectionOrder = ["welcome", "todays-mission", "learning-journey"] as const;
export const learningJourneySecondaryAction = "browse-courses" as const;
