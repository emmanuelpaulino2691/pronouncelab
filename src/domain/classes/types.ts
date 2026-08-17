import type { ClassStatus } from "../shared/constants";
export type { ClassStatus } from "../shared/constants";

export type ClassSummary = { id: number; name: string; status: ClassStatus; ownerId?: string; owner?: string; courseCount?: number; studentCount?: number; term?: string; updatedAt?: string; };
export type ClassWorkspace = ClassSummary & { description?: string; joinCodeEnabled?: boolean; };
export type TeacherSummary = { id: string; displayName?: string; email?: string; };
export type StudentSummary = { id: string; displayName?: string; };
