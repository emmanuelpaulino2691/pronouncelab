import type { LearnerCourse, LearnerLessonSummary, LearnerUnit } from "../../shared/content/contracts/learnerContent";

type LocalProgress = {
  lessonsStarted: readonly string[];
  lessonsCompleted: readonly string[];
  activitiesCompleted: readonly { lessonId: string; activities: readonly number[] }[];
};

export type DashboardLessonContext = { course: LearnerCourse; unit: LearnerUnit; lesson: LearnerLessonSummary };
export type NextLearnerAction = DashboardLessonContext & {
  kind: "start" | "continue" | "review";
  activityIndex: number;
  completedActivities: number;
  lessonProgress: number;
  href: string;
};

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
  return courses.flatMap((course) => course.units.flatMap((unit) => unit.lessons.filter((lesson) => lesson.available && lesson.activityCount > 0).map((lesson) => ({ course, unit, lesson }))));
}

function actionFromContext(context: DashboardLessonContext, progress: LocalProgress, activityIndex: number, kind: NextLearnerAction["kind"]): NextLearnerAction {
  const completedActivities = new Set(progress.activitiesCompleted.find((item) => item.lessonId === context.lesson.id)?.activities.filter((index) => index >= 0 && index < context.lesson.activityCount) ?? []).size;
  return { ...context, kind, activityIndex, completedActivities, lessonProgress: context.lesson.activityCount === 0 ? 0 : Math.round(completedActivities / context.lesson.activityCount * 100), href: `/lessons/${context.lesson.id}` };
}

export function resolveNextLearnerAction(courses: readonly LearnerCourse[], progress: LocalProgress, resumedActivityByLesson: Readonly<Record<string, number>> = {}): NextLearnerAction | null {
  const lessons = availableLessons(courses);
  if (!lessons.length) return null;
  const byId = new Map<string, DashboardLessonContext>(lessons.map((context) => [context.lesson.id, context]));
  const completed = new Set<string>(progress.lessonsCompleted);

  const resumed = [...progress.lessonsStarted].reverse().map((id) => byId.get(id)).find((context): context is DashboardLessonContext => Boolean(context && !completed.has(context.lesson.id)));
  if (resumed) {
    const storedIndex = resumedActivityByLesson[resumed.lesson.id] ?? 0;
    const activityIndex = Math.min(Math.max(storedIndex, 0), resumed.lesson.activityCount - 1);
    return actionFromContext(resumed, progress, activityIndex, "continue");
  }

  const validHistory = [...progress.lessonsStarted, ...progress.lessonsCompleted].filter((id) => byId.has(id));
  const current = validHistory.length ? byId.get(validHistory.at(-1)!) : undefined;
  if (current) {
    const nextInCourse = lessons.find((context) => context.course.id === current.course.id && !completed.has(context.lesson.id));
    if (nextInCourse) return actionFromContext(nextInCourse, progress, 0, "start");
  }

  const first = lessons[0];
  return actionFromContext(first, progress, 0, completed.has(first.lesson.id) ? "review" : "start");
}

export function buildCurrentCourseSummary(action: NextLearnerAction, progress: LocalProgress): CurrentCourseSummary {
  const lessonIds = action.course.units.flatMap((unit) => unit.lessons.filter((lesson) => lesson.available && lesson.activityCount > 0).map((lesson) => lesson.id));
  const completed = new Set<string>(progress.lessonsCompleted);
  const completedLessons = lessonIds.filter((id) => completed.has(id)).length;
  return { courseId: action.course.id, courseTitle: action.course.title, unitTitle: action.unit.title, completedLessons, totalLessons: lessonIds.length, percent: lessonIds.length ? Math.round(completedLessons / lessonIds.length * 100) : 0 };
}

export function calculateLearnerDashboardProgress(courses: readonly LearnerCourse[], progress: LocalProgress): LearnerDashboardProgress {
  const completed = new Set<string>(progress.lessonsCompleted);
  const courseLessonIds = courses.map((course) => course.units.flatMap((unit) => unit.lessons.filter((lesson) => lesson.available && lesson.activityCount > 0).map((lesson) => lesson.id)));
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
