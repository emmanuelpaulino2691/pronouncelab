import type { LearnerContentProvider } from "../../../shared/content/providers/LearnerContentProvider";
import type { LearnerCourse, LearnerLesson } from "../../../shared/content/contracts/learnerContent";
import type { ContentId } from "../../../shared/content/contracts/learnerContent";

export type TeacherPreviewSource = "draft" | "published" | "local";
export type TeacherPreviewResult<T> =
  | { status: "ready"; source: TeacherPreviewSource; value: T }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "unavailable"; reason: string };

export type TeacherPreviewSources = {
  draft?: {
    getCourse?: (id: ContentId, signal?: AbortSignal) => Promise<LearnerCourse | null>;
    getLesson?: (id: ContentId, signal?: AbortSignal) => Promise<LearnerLesson | null>;
  };
  published: LearnerContentProvider;
  local: LearnerContentProvider;
};

async function resolve<T>(
  id: ContentId,
  draft: ((id: ContentId, signal?: AbortSignal) => Promise<T | null>) | undefined,
  published: (id: ContentId, signal?: AbortSignal) => Promise<{ ok: true; value: T } | { ok: false; error: { code: string; message: string } }>,
  local: (id: ContentId, signal?: AbortSignal) => Promise<{ ok: true; value: T } | { ok: false; error: { code: string; message: string } }>,
  signal?: AbortSignal,
): Promise<TeacherPreviewResult<T>> {
  if (draft) {
    const draftValue = await draft(id, signal);
    if (draftValue) return { status: "ready", source: "draft", value: draftValue };
  }
  const publishedResult = await published(id, signal);
  if (publishedResult.ok) return { status: "ready", source: "published", value: publishedResult.value };
  const localResult = await local(id, signal);
  if (localResult.ok) return { status: "ready", source: "local", value: localResult.value };
  if (publishedResult.error.code === "forbidden") return { status: "forbidden" };
  return { status: "not_found" };
}

export function resolveTeacherPreviewLesson(
  id: ContentId,
  sources: TeacherPreviewSources,
  signal?: AbortSignal,
) {
  return resolve(id, sources.draft?.getLesson, sources.published.getLesson.bind(sources.published), sources.local.getLesson.bind(sources.local), signal);
}

export function resolveTeacherPreviewCourse(
  id: ContentId,
  sources: TeacherPreviewSources,
  signal?: AbortSignal,
) {
  return resolve(id, sources.draft?.getCourse, sources.published.getCourse.bind(sources.published), sources.local.getCourse.bind(sources.local), signal);
}
