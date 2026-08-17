import { UserRole, type UserRole as UserRoleValue } from "../shared/constants";

export type PermissionContext = { role: UserRoleValue; userId?: string; ownerId?: string; published?: boolean; draft?: boolean; };
export const canViewCourse = ({ role }: PermissionContext) => role !== UserRole.Student;
export const canEditCourse = ({ role, ownerId, userId, draft }: PermissionContext) => Boolean(draft && (role === UserRole.Administrator || ((role === UserRole.Teacher || role === UserRole.Editor) && ownerId === userId)));
export const canPublishCourse = ({ role, ownerId, userId }: PermissionContext) => role === UserRole.Administrator || role === UserRole.Publisher || (role === UserRole.Teacher && ownerId === userId);
export const canDuplicateCourse = (context: PermissionContext) => canEditCourse(context);
export const canCreateClass = ({ role }: PermissionContext) => role === UserRole.Administrator || role === UserRole.Teacher;
export const canManageClass = ({ role, ownerId, userId }: PermissionContext) => role === UserRole.Administrator || (role === UserRole.Teacher && ownerId === userId);
export const canAssignCourse = canManageClass;
export const canViewStudentProgress = canManageClass;
