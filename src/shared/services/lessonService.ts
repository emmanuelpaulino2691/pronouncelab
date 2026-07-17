import { contentProvider } from "../content/providers/localContentProvider";

function getPlayableLessonData(lessonId: number) {
  const lessonSummary =
    getLessonSummary(lessonId);

  if (!lessonSummary) {
    return undefined;
  }

  const unit = contentProvider
    .getUnits()
    .find(
      (item) =>
        item.id === lessonSummary.unitId &&
        item.lessons.includes(lessonSummary.id)
    );

  if (!unit) {
    return undefined;
  }

  const course = contentProvider
    .getCourses()
    .find(
      (item) =>
        item.id === unit.courseId &&
        item.units.includes(unit.id)
    );

  if (!course) {
    return undefined;
  }

  const lessonData =
    contentProvider.getLessonData()[
      lessonSummary.lessonDataId
    ];

  if (
    !lessonData ||
    lessonData.id !== lessonSummary.id
  ) {
    return undefined;
  }

  return lessonData;
}

export function getLessonsByUnit(unitId: number) {
  return contentProvider
    .getLessons()
    .filter((lesson) => lesson.unitId === unitId);
}

export function getLessonSummary(lessonId: number) {
  return contentProvider
    .getLessons()
    .find((lesson) => lesson.id === lessonId);
}

export function isLessonPlayable(
  lessonId: number
) {
  return getPlayableLessonData(lessonId) !==
    undefined;
}

export function getPlayableLessonsByUnit(
  unitId: number
) {
  return getLessonsByUnit(unitId).filter(
    (lesson) =>
      isLessonPlayable(lesson.id)
  );
}

export function getPlayableLessonsByCourse(
  courseId: number
) {
  const course = contentProvider
    .getCourses()
    .find((item) => item.id === courseId);

  if (!course) {
    return [];
  }

  return course.units.flatMap((unitId) => {
    const unit = contentProvider
      .getUnits()
      .find(
        (item) =>
          item.id === unitId &&
          item.courseId === course.id
      );

    return unit
      ? getPlayableLessonsByUnit(unit.id)
      : [];
  });
}

export function getLesson(lessonId: number) {
  return getPlayableLessonData(lessonId);
}
