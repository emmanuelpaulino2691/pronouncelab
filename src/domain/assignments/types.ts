import type { AssignmentStatus } from "../shared/constants";

export type AssignmentSummary = { id: number; classId: number; title: string; status: AssignmentStatus; dueAt?: string; };
export type CreateAssignmentInput = { classId: number; title: string; instructions?: string; dueAt?: string; };
export type CreateClassInput = { name: string; description?: string; term?: string; startDate?: string; endDate?: string; schedule?: string; color?: string; };
export type JoinClassInput = { code: string };
export type EnrollmentInput = { classId: number; studentId: string; };
