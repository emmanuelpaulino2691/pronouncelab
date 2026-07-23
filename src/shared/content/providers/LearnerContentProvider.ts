import type {
  ContentId,
  LearnerCourse,
  LearnerLesson,
  LearnerLessonSummary,
  LearnerUnit,
  LearnerUnitSummary,
} from "../contracts/learnerContent";
import type { ContentResult } from "../errors/contentErrors";

export interface LearnerContentProvider {
  listCourses(
    signal?: AbortSignal
  ): Promise<
    ContentResult<
      readonly LearnerCourse[]
    >
  >;

  getCourse(
    id: ContentId,
    signal?: AbortSignal
  ): Promise<ContentResult<LearnerCourse>>;

  listUnits(
    courseId: ContentId,
    signal?: AbortSignal
  ): Promise<
    ContentResult<
      readonly LearnerUnitSummary[]
    >
  >;

  getUnit(
    id: ContentId,
    signal?: AbortSignal
  ): Promise<ContentResult<LearnerUnit>>;

  listLessons(
    unitId: ContentId,
    signal?: AbortSignal
  ): Promise<
    ContentResult<
      readonly LearnerLessonSummary[]
    >
  >;

  getLesson(
    id: ContentId,
    signal?: AbortSignal
  ): Promise<ContentResult<LearnerLesson>>;
}
