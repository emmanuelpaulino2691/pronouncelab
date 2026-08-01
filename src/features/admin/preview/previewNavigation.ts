export function buildStudentPreviewUrl(input: { courseId: number | string; lessonId?: number | string; returnTo?: string; activityId?: number | string }): string {
  const path = input.lessonId === undefined
    ? `/admin/preview/courses/${input.courseId}`
    : `/admin/preview/courses/${input.courseId}/lessons/${input.lessonId}`;
  const params = new URLSearchParams();
  if (input.returnTo?.startsWith("/admin/")) params.set("returnTo", input.returnTo);
  if (input.activityId !== undefined) params.set("activity", String(input.activityId));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function safePreviewReturnTo(value: string | null, fallback: string): string {
  return value?.startsWith("/admin/") ? value : fallback;
}

export function previewExitPath(returnTo: string | null, activityId: string | null, fallback: string): string {
  const safe = safePreviewReturnTo(returnTo, fallback);
  if (!activityId || !/^\d+$/.test(activityId)) return safe;
  const [pathname, query = ""] = safe.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("activity", activityId);
  return `${pathname}?${params.toString()}`;
}
