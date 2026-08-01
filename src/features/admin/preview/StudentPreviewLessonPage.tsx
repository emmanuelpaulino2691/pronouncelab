import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import MainLayout from "../../../shared/layouts/MainLayout";
import { learnerContentProvider } from "../../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../../shared/content/hooks/useLearnerResource";
import { isDecimalContentId } from "../../../shared/content/contracts/publishedRpcGuards";
import type { ContentId, LearnerLesson, LearnerUnit } from "../../../shared/content/contracts/learnerContent";
import { contentFailure, contentSuccess } from "../../../shared/content/errors/contentErrors";
import LessonPlayer from "../../lesson/LessonPlayer";
import { StudentPreviewToolbar } from "./StudentPreviewToolbar";
import { resolveTeacherPreviewLesson } from "./teacherPreviewResolver";
import { getDraftLesson } from "./teacherPreviewSources";
import { staticLearnerContentProvider } from "../../../shared/content/providers/staticLearnerContentProvider";
import { PreviewTerminalState } from "./PreviewTerminalState";
import { safePreviewReturnTo } from "./previewNavigation";
import { previewViewportStyle, type PreviewViewportMode } from "./previewViewport";
import { PreviewLoadingState } from "./PreviewLoadingState";

export default function StudentPreviewLessonPage() {
  const { courseId = "", lessonId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [viewportMode, setViewportMode] = useState<PreviewViewportMode>("desktop");
  const returnPath = safePreviewReturnTo(searchParams.get("returnTo"), `/admin/courses/${courseId}?tab=curriculum`);
  const validId = isDecimalContentId(lessonId) ? lessonId as unknown as ContentId : null;
  const resource = useLearnerResource<{ lesson: LearnerLesson; unit: LearnerUnit; source: "draft" | "published" | "local" }>(async (signal) => {
    if (!validId) return contentFailure("not_found", "Lesson not found.");
    const resolved = await resolveTeacherPreviewLesson(validId, { draft: { getLesson: getDraftLesson }, published: learnerContentProvider, local: staticLearnerContentProvider }, signal);
    if (resolved.status !== "ready") return contentFailure(resolved.status === "forbidden" ? "forbidden" : resolved.status === "error" ? "unexpected" : "unavailable", resolved.status === "forbidden" ? "You do not have permission to preview this lesson." : resolved.status === "error" ? "The lesson preview encountered an unexpected problem. Retry or return to the Studio." : "No saved draft, published version, or local lesson content was found.", resolved.status === "error");
    const lesson = resolved.value;
    const unitResult = await learnerContentProvider.getUnit(lesson.unitId, signal);
    const localUnitResult = unitResult.ok ? unitResult : await staticLearnerContentProvider.getUnit(lesson.unitId, signal);
    const unit = localUnitResult.ok ? localUnitResult.value : {
      id: lesson.unitId,
      courseId: lesson.courseId,
      title: "Course unit",
      description: "",
      position: 0,
      lessonCount: 1,
      lessons: [],
    };
    return contentSuccess({ lesson, unit, source: resolved.source }, "preview");
  }, [validId]);

  if (!resource.loading && !resource.value) return <PreviewTerminalState courseId={courseId} error={resource.error} onRetry={resource.retry} returnPath={returnPath} />;
  if (!resource.value) return <PreviewLoadingState returnPath={returnPath} />;
  const { lesson, unit, source } = resource.value;
  return <><StudentPreviewToolbar returnPath={returnPath} draft={source === "draft"} source={source} viewportMode={viewportMode} onViewportModeChange={setViewportMode} /><div className="mx-auto min-w-0 overflow-x-hidden" style={previewViewportStyle(viewportMode)}><MainLayout immersive><LessonPlayer key={lesson.id} lesson={lesson} returnPath={returnPath} contextLabel={unit.title} runtimeMode="teacher_preview" layoutMode={viewportMode} /></MainLayout></div></>;
}
