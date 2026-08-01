import type { LearnerContentProvider } from "../../../shared/content/providers/LearnerContentProvider";
import type { LearnerCourse, LearnerLesson } from "../../../shared/content/contracts/learnerContent";
import type { ContentId } from "../../../shared/content/contracts/learnerContent";

export type TeacherPreviewSource = "draft" | "published" | "local";
export type TeacherPreviewResult<T> =
  | { status: "ready"; source: TeacherPreviewSource; value: T }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "unavailable"; reason: string }
  | { status: "error"; reason: string };

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
  let unexpectedFailure = false;
  if (draft) {
    try {
      const draftValue = await draft(id, signal);
      if (draftValue) return { status: "ready", source: "draft", value: draftValue };
    } catch {
      unexpectedFailure = true;
    }
  }
  try {
    const publishedResult = await published(id, signal);
    if (publishedResult.ok) return { status: "ready", source: "published", value: publishedResult.value };
    if (publishedResult.error.code === "forbidden") return { status: "forbidden" };
    unexpectedFailure ||= publishedResult.error.code === "unexpected";
  } catch {
    unexpectedFailure = true;
  }
  try {
    const localResult = await local(id, signal);
    if (localResult.ok) return { status: "ready", source: "local", value: localResult.value };
    unexpectedFailure ||= localResult.error.code === "unexpected";
  } catch {
    return { status: "error", reason: "Preview sources could not be loaded." };
  }
  return unexpectedFailure
    ? { status: "error", reason: "Preview sources could not be loaded." }
    : { status: "unavailable", reason: "No saved draft, published version, or local content is available." };
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
