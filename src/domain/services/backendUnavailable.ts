import { BackendUnavailableError } from "../shared/errors";
import type { AssignmentService, ClassService, CourseService, EnrollmentService, ProgressService, PublishingService } from "./contracts";
import type { CreateAssignmentInput, CreateClassInput, EnrollmentInput, JoinClassInput } from "../assignments/types";

const unavailable = (...args: unknown[]): never => { void args; throw new BackendUnavailableError(); };

export class BackendUnavailableCourseService implements CourseService {
  list = async () => unavailable();
  get = async (courseId: number) => unavailable(courseId);
}
export class BackendUnavailableClassService implements ClassService {
  list = async () => unavailable();
  get = async (classId: number) => unavailable(classId);
  create = async (input: CreateClassInput) => unavailable(input);
}
export class BackendUnavailableAssignmentService implements AssignmentService {
  create = async (input: CreateAssignmentInput) => unavailable(input);
}
export class BackendUnavailableEnrollmentService implements EnrollmentService {
  join = async (input: JoinClassInput) => unavailable(input);
  enroll = async (input: EnrollmentInput) => unavailable(input);
}
export class BackendUnavailablePublishingService implements PublishingService {
  publishCourse = async (input: Parameters<PublishingService["publishCourse"]>[0]) => unavailable(input);
  publishLesson = async (lessonVersionId: number) => unavailable(lessonVersionId);
}
export class BackendUnavailableProgressService implements ProgressService {
  getClassProgress = async (classId: number) => unavailable(classId);
}
