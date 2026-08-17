export type PreviewTarget = "draft" | "published";

export function buildStudentPreviewUrl(input: { courseId: number | string; unitId?: number | string; lessonId?: number | string; target?: PreviewTarget; returnTo?: string; activityId?: number | string }): string {
  const path = input.lessonId !== undefined
    ? `/admin/preview/courses/${input.courseId}/lessons/${input.lessonId}`
    : input.unitId !== undefined
      ? `/admin/preview/courses/${input.courseId}/units/${input.unitId}`
      : `/admin/preview/courses/${input.courseId}`;
  const params = new URLSearchParams();
  params.set("preview", input.target ?? "draft");
  if (input.returnTo?.startsWith("/admin/")) params.set("returnTo", input.returnTo);
  if (input.activityId !== undefined) params.set("activity", String(input.activityId));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function previewTarget(value: string | null): PreviewTarget {
  return value === "published" ? "published" : "draft";
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
