import type { ClassSummary, ClassWorkspace } from "../classes/types";
import type { CreateAssignmentInput, CreateClassInput, AssignmentSummary, EnrollmentInput, JoinClassInput } from "../assignments/types";
import type { CourseSummary, CourseWorkspace } from "../courses/types";
import type { PublishCourseInput, PublishCourseResponse, PublishLessonResponse } from "../publishing/types";

export interface CourseService { list(): Promise<CourseSummary[]>; get(courseId: number): Promise<CourseWorkspace>; }
export interface ClassService { list(): Promise<ClassSummary[]>; get(classId: number): Promise<ClassWorkspace>; create(input: CreateClassInput): Promise<ClassWorkspace>; }
export interface AssignmentService { create(input: CreateAssignmentInput): Promise<AssignmentSummary>; }
export interface EnrollmentService { join(input: JoinClassInput): Promise<void>; enroll(input: EnrollmentInput): Promise<void>; }
export interface PublishingService { publishCourse(input: PublishCourseInput): Promise<PublishCourseResponse>; publishLesson(lessonVersionId: number): Promise<PublishLessonResponse>; }
export interface ProgressService { getClassProgress(classId: number): Promise<ReadonlyArray<{ studentId: string; completedLessons: number }>>; }
