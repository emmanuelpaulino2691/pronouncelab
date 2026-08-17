import type { LearnerCourse, LearnerLessonSummary, LearnerUnit } from "../../shared/content/contracts/learnerContent";

export type LearnerJourneyProgress = {
  lessonsStarted: readonly string[];
  lessonsCompleted: readonly string[];
  activitiesCompleted: readonly { lessonId: string; activities: readonly number[] }[];
};

export type LearnerJourneyState = "not_started" | "in_progress" | "completed" | "empty";
export type LearnerJourneyAction = "start" | "continue" | "review";

export type LearnerLessonJourney = {
  lesson: LearnerLessonSummary;
  state: LearnerJourneyState;
  action: LearnerJourneyAction | null;
  completedActivities: number;
  totalActivities: number;
  percent: number;
  activityIndex: number;
  locked: boolean;
  current: boolean;
};

export type LearnerUnitJourney = {
  unit: LearnerUnit;
  state: LearnerJourneyState;
  action: LearnerJourneyAction | null;
  completedLessons: number;
  totalLessons: number;
  percent: number;
  locked: boolean;
  current: boolean;
};

export type LearnerCourseJourney = {
  course: LearnerCourse;
  state: LearnerJourneyState;
  action: LearnerJourneyAction | null;
  completedLessons: number;
  totalLessons: number;
  percent: number;
};

export type RecommendedLearnerStep = {
  course: LearnerCourse;
  unit: LearnerUnit;
  lesson: LearnerLessonSummary;
  kind: LearnerJourneyAction;
  activityIndex: number;
  completedActivities: number;
  lessonProgress: number;
  href: string;
};

type RecommendationScope = { courseId?: string; unitId?: string };
type LessonContext = { course: LearnerCourse; unit: LearnerUnit; lesson: LearnerLessonSummary };

export function isUsableLearnerLesson(lesson: LearnerLessonSummary) {
  return lesson.available && lesson.activityCount > 0;
}

function completedActivityIndexes(lesson: LearnerLessonSummary, progress: LearnerJourneyProgress) {
  return new Set(progress.activitiesCompleted.find((item) => item.lessonId === lesson.id)?.activities.filter((index) => index >= 0 && index < lesson.activityCount) ?? []);
}

export function resolveLearnerLessonState(lesson: LearnerLessonSummary, progress: LearnerJourneyProgress, activityIndex = 0): LearnerLessonJourney {
  if (!isUsableLearnerLesson(lesson)) return { lesson, state: "empty", action: null, completedActivities: 0, totalActivities: 0, percent: 0, activityIndex: 0, locked: false, current: false };
  const completedActivities = completedActivityIndexes(lesson, progress).size;
  const complete = progress.lessonsCompleted.includes(lesson.id);
  const started = progress.lessonsStarted.includes(lesson.id) || completedActivities > 0;
  const safeActivityIndex = Math.min(Math.max(activityIndex, 0), lesson.activityCount - 1);
  return {
    lesson,
    state: complete ? "completed" : started ? "in_progress" : "not_started",
    action: complete ? "review" : started ? "continue" : "start",
    completedActivities,
    totalActivities: lesson.activityCount,
    percent: complete ? 100 : Math.round(completedActivities / lesson.activityCount * 100),
    activityIndex: safeActivityIndex,
    locked: false,
    current: false,
  };
}

export function resolveLearnerUnitState(unit: LearnerUnit, progress: LearnerJourneyProgress): LearnerUnitJourney {
  const lessons = unit.lessons.filter(isUsableLearnerLesson);
  if (!lessons.length) return { unit, state: "empty", action: null, completedLessons: 0, totalLessons: 0, percent: 0, locked: false, current: false };
  const completedLessons = lessons.filter((lesson) => progress.lessonsCompleted.includes(lesson.id)).length;
  const started = lessons.some((lesson) => progress.lessonsStarted.includes(lesson.id) || progress.activitiesCompleted.some((item) => item.lessonId === lesson.id && item.activities.length > 0));
  const state = completedLessons === lessons.length ? "completed" : completedLessons > 0 || started ? "in_progress" : "not_started";
  return { unit, state, action: state === "completed" ? "review" : state === "in_progress" ? "continue" : "start", completedLessons, totalLessons: lessons.length, percent: Math.round(completedLessons / lessons.length * 100), locked: false, current: false };
}

export function resolveSequentialLessonJourneys(unit: LearnerUnit, progress: LearnerJourneyProgress, activityPositions: Readonly<Record<string, number>> = {}) {
  let prerequisiteComplete = true;
  let currentAssigned = false;
  return unit.lessons.map((lesson) => {
    const journey = resolveLearnerLessonState(lesson, progress, activityPositions[lesson.id] ?? 0);
    const locked = isUsableLearnerLesson(lesson) && !prerequisiteComplete;
    const current = !locked && !currentAssigned && isUsableLearnerLesson(lesson) && journey.state !== "completed";
    if (current) currentAssigned = true;
    if (isUsableLearnerLesson(lesson) && journey.state !== "completed") prerequisiteComplete = false;
    return { ...journey, locked, current, action: locked ? null : journey.action };
  });
}

export function resolveSequentialUnitJourneys(course: LearnerCourse, progress: LearnerJourneyProgress) {
  let prerequisiteComplete = true;
  let currentAssigned = false;
  return course.units.map((unit) => {
    const journey = resolveLearnerUnitState(unit, progress);
    const locked = journey.state !== "empty" && !prerequisiteComplete;
    const current = !locked && !currentAssigned && journey.state !== "empty" && journey.state !== "completed";
    if (current) currentAssigned = true;
    if (journey.state !== "empty" && journey.state !== "completed") prerequisiteComplete = false;
    return { ...journey, locked, current, action: locked ? null : journey.action };
  });
}

export function isLearnerUnitUnlocked(course: LearnerCourse, unitId: string, progress: LearnerJourneyProgress) {
  return resolveSequentialUnitJourneys(course, progress).find((item) => item.unit.id === unitId)?.locked === false;
}

export function isLearnerLessonUnlocked(unit: LearnerUnit, lessonId: string, progress: LearnerJourneyProgress) {
  return resolveSequentialLessonJourneys(unit, progress).find((item) => item.lesson.id === lessonId)?.locked === false;
}

export function resolveLearnerCourseState(course: LearnerCourse, progress: LearnerJourneyProgress): LearnerCourseJourney {
  const lessons = course.units.flatMap((unit) => unit.lessons.filter(isUsableLearnerLesson));
  if (!lessons.length) return { course, state: "empty", action: null, completedLessons: 0, totalLessons: 0, percent: 0 };
  const completedLessons = lessons.filter((lesson) => progress.lessonsCompleted.includes(lesson.id)).length;
  const started = lessons.some((lesson) => progress.lessonsStarted.includes(lesson.id) || progress.activitiesCompleted.some((item) => item.lessonId === lesson.id && item.activities.length > 0));
  const state = completedLessons === lessons.length ? "completed" : completedLessons > 0 || started ? "in_progress" : "not_started";
  return { course, state, action: state === "completed" ? "review" : state === "in_progress" ? "continue" : "start", completedLessons, totalLessons: lessons.length, percent: Math.round(completedLessons / lessons.length * 100) };
}

function availableLessonContexts(courses: readonly LearnerCourse[], progress: LearnerJourneyProgress) {
  return courses.flatMap((course) => resolveSequentialUnitJourneys(course, progress).filter((unitJourney) => !unitJourney.locked).flatMap(({ unit }) => resolveSequentialLessonJourneys(unit, progress).filter((lessonJourney) => !lessonJourney.locked && isUsableLearnerLesson(lessonJourney.lesson)).map(({ lesson }) => ({ course, unit, lesson }))));
}

function stepFromContext(context: LessonContext, progress: LearnerJourneyProgress, activityPositions: Readonly<Record<string, number>>, kind: LearnerJourneyAction): RecommendedLearnerStep {
  const lessonJourney = resolveLearnerLessonState(context.lesson, progress, activityPositions[context.lesson.id] ?? 0);
  return { ...context, kind, activityIndex: lessonJourney.activityIndex, completedActivities: lessonJourney.completedActivities, lessonProgress: lessonJourney.percent, href: `/lessons/${context.lesson.id}` };
}

export function resolveRecommendedLearnerStep(courses: readonly LearnerCourse[], progress: LearnerJourneyProgress, activityPositions: Readonly<Record<string, number>> = {}, scope: RecommendationScope = {}): RecommendedLearnerStep | null {
  const allContexts = availableLessonContexts(courses, progress);
  const contexts = allContexts.filter(({ course, unit }) => (!scope.courseId || course.id === scope.courseId) && (!scope.unitId || unit.id === scope.unitId));
  if (!contexts.length) return null;
  const completed = new Set<string>(progress.lessonsCompleted);
  const byId = new Map<string, LessonContext>(contexts.map((context) => [context.lesson.id, context]));

  const resumed = [...progress.lessonsStarted].reverse().map((id) => byId.get(id)).find((context): context is LessonContext => Boolean(context && !completed.has(context.lesson.id)));
  if (resumed) return stepFromContext(resumed, progress, activityPositions, "continue");

  if (!scope.courseId && !scope.unitId) {
    const allById = new Map<string, LessonContext>(allContexts.map((context) => [context.lesson.id, context]));
    const history = [...progress.lessonsStarted, ...progress.lessonsCompleted].filter((id) => allById.has(id));
    const currentCourseId = history.length ? allById.get(history.at(-1)!)?.course.id : undefined;
    const currentCourseNext = currentCourseId ? contexts.find((context) => context.course.id === currentCourseId && !completed.has(context.lesson.id)) : undefined;
    if (currentCourseNext) return stepFromContext(currentCourseNext, progress, activityPositions, "start");
  }

  const firstIncomplete = contexts.find((context) => !completed.has(context.lesson.id));
  if (firstIncomplete) return stepFromContext(firstIncomplete, progress, activityPositions, resolveLearnerLessonState(firstIncomplete.lesson, progress).action === "continue" ? "continue" : "start");
  return stepFromContext(contexts[0], progress, activityPositions, "review");
}

export function learnerJourneyStateLabel(state: LearnerJourneyState) {
  if (state === "in_progress") return "In progress";
  if (state === "completed") return "Completed";
  if (state === "empty") return "No lessons available";
  return "Not started";
}

export function learnerJourneyActionLabel(kind: LearnerJourneyAction, target: "course" | "unit" | "lesson") {
  const action = kind === "continue" ? "Continue" : kind === "review" ? "Review" : "Start";
  return `${action} ${target}`;
}

export const coursePageHierarchy = ["recommended-course", "other-courses"] as const;
export const courseDetailHierarchy = ["course-context", "recommended-unit", "all-units"] as const;
export const unitDetailHierarchy = ["unit-context", "recommended-lesson", "all-lessons"] as const;
