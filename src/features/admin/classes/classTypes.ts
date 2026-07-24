export type ClassStatus = "draft" | "active" | "archived";

export type ClassSummary = {
  id: number;
  name: string;
  status: ClassStatus;
  courseCount?: number;
  studentCount?: number;
  term?: string;
  updatedAt?: string;
  owner?: string;
};
