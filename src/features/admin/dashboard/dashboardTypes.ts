import type { CourseStatus } from "../courses/adminCourseService";

export type DashboardStats = {
  totalCourses: number;
  draftCourses: number;
  publishedCourses: number;
  totalUnits: number;
  totalLessons: number;
  totalActivities: number;
};

export type RecentCourse = {
  id: number;
  title: string;
  description: string;
  status: CourseStatus;
  emoji: string;
  updatedAt: string;
  unitCount: number;
};

export type AttentionSummary = {
  draftCoursesWithoutUnits: number;
  draftUnitsWithoutLessons: number;
  draftLessonsWithoutContent: number;
};

export type RecentStudioLink = {
  courseId: number;
  unitId: number;
  lessonId: number;
  lessonTitle: string;
};

export type AdminDashboardData = {
  stats: DashboardStats;
  recentCourses: RecentCourse[];
  attention: AttentionSummary;
  recentStudio: RecentStudioLink | null;
};
