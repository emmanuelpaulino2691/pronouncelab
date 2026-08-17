import { supabase } from "../../../shared/lib/supabaseClient";
import type { CourseStatus } from "../courses/adminCourseService";
import type { AdminDashboardData } from "./dashboardTypes";

type CourseRow = { id: number; title: string; description: string; status: CourseStatus; emoji: string; updated_at: string };
type UnitRow = { id: number; course_id: number; status: CourseStatus };
type LessonRow = { id: number; unit_id: number; title: string; status: CourseStatus; updated_at: string };
type VersionRow = { id: number; lesson_id: number; status: CourseStatus };
type ActivityRow = { id: number; lesson_version_id: number };

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const client = requireSupabase();
  const [coursesResult, unitsResult, lessonsResult, versionsResult, activitiesResult] = await Promise.all([
    client.from("courses").select("id,title,description,status,emoji,updated_at").order("updated_at", { ascending: false }),
    client.from("units").select("id,course_id,status"),
    client.from("lessons").select("id,unit_id,title,status,updated_at"),
    client.from("lesson_versions").select("id,lesson_id,status"),
    client.from("lesson_activities").select("id,lesson_version_id"),
  ]);

  const firstError = [coursesResult.error, unitsResult.error, lessonsResult.error, versionsResult.error, activitiesResult.error].find(Boolean);
  if (firstError) throw firstError;

  const courses = (coursesResult.data ?? []) as unknown as CourseRow[];
  const units = (unitsResult.data ?? []) as unknown as UnitRow[];
  const lessons = (lessonsResult.data ?? []) as unknown as LessonRow[];
  const versions = (versionsResult.data ?? []) as unknown as VersionRow[];
  const activities = (activitiesResult.data ?? []) as unknown as ActivityRow[];
  const unitsByCourse = new Map<number, number>();
  const lessonsByUnit = new Map<number, number>();
  const activityVersionIds = new Set(activities.map((activity) => activity.lesson_version_id));
  units.forEach((unit) => unitsByCourse.set(unit.course_id, (unitsByCourse.get(unit.course_id) ?? 0) + 1));
  lessons.forEach((lesson) => lessonsByUnit.set(lesson.unit_id, (lessonsByUnit.get(lesson.unit_id) ?? 0) + 1));

  const draftVersionByLesson = new Map<number, number>();
  versions.filter((version) => version.status === "draft").forEach((version) => draftVersionByLesson.set(version.lesson_id, version.id));
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const coursesById = new Map(courses.map((course) => [course.id, course]));
  const recentDraftLesson = [...lessons]
    .filter((lesson) => lesson.status === "draft" && draftVersionByLesson.has(lesson.id))
    .sort((first, second) => Date.parse(second.updated_at) - Date.parse(first.updated_at))
    .find((lesson) => {
      const unit = unitsById.get(lesson.unit_id);
      return unit?.status === "draft" && coursesById.get(unit.course_id)?.status === "draft";
    });
  const recentUnit = recentDraftLesson ? unitsById.get(recentDraftLesson.unit_id) : undefined;

  return {
    stats: {
      totalCourses: courses.length,
      draftCourses: courses.filter((course) => course.status === "draft").length,
      publishedCourses: courses.filter((course) => course.status === "published").length,
      totalUnits: units.length,
      totalLessons: lessons.length,
      totalActivities: activities.length,
    },
    recentCourses: courses.slice(0, 5).map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      status: course.status,
      emoji: course.emoji,
      updatedAt: course.updated_at,
      unitCount: unitsByCourse.get(course.id) ?? 0,
    })),
    attention: {
      draftCoursesWithoutUnits: courses.filter((course) => course.status === "draft" && !unitsByCourse.has(course.id)).length,
      draftUnitsWithoutLessons: units.filter((unit) => unit.status === "draft" && !lessonsByUnit.has(unit.id)).length,
      draftLessonsWithoutContent: lessons.filter((lesson) => {
        if (lesson.status !== "draft") return false;
        const versionId = draftVersionByLesson.get(lesson.id);
        return !versionId || !activityVersionIds.has(versionId);
      }).length,
    },
    recentStudio: recentDraftLesson && recentUnit ? {
      courseId: recentUnit.course_id,
      unitId: recentUnit.id,
      lessonId: recentDraftLesson.id,
      lessonTitle: recentDraftLesson.title,
    } : null,
  };
}
