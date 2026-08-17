import { resolveReleaseNavigation, type ReleaseNavigation } from "../releases/releaseNavigation";
import { getReleaseManifest, getReleaseProgress, type ReleaseProgress } from "../releases/releaseService";
import { listClassCourseAssignments, listMyMemberships, type ClassCourseAssignment, type EnrollmentRecord } from "./classService";

export type LearnerAssignmentSnapshot = ClassCourseAssignment & {
  classId: number;
  className: string;
  navigation: ReleaseNavigation;
  progress: ReleaseProgress;
  lastAccessedAt: string | null;
};

export type LearnerClassWorkspace = {
  memberships: EnrollmentRecord[];
  assignments: LearnerAssignmentSnapshot[];
};

export async function loadLearnerClassWorkspace(): Promise<LearnerClassWorkspace> {
  const memberships = await listMyMemberships();
  const groups = await Promise.all(memberships.map(async (membership) => {
    const assignments = await listClassCourseAssignments(membership.class_id);
    return Promise.all(assignments.map(async (assignment): Promise<LearnerAssignmentSnapshot> => {
      const [manifest, progress] = await Promise.all([
        getReleaseManifest(assignment.releaseId),
        getReleaseProgress(assignment.releaseId),
      ]);
      const accesses = progress.lessons.flatMap((row) => row.lastAccessedAt ? [row.lastAccessedAt] : []);
      return {
        ...assignment,
        classId: membership.class_id,
        className: membership.classes?.name ?? "Class",
        navigation: resolveReleaseNavigation(manifest, progress),
        progress,
        lastAccessedAt: accesses.sort().at(-1) ?? null,
      };
    }));
  }));
  return { memberships, assignments: groups.flat() };
}
