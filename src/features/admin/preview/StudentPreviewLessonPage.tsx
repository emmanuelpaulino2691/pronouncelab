import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useLearnerResource } from "../../../shared/content/hooks/useLearnerResource";
import { isDecimalContentId } from "../../../shared/content/contracts/publishedRpcGuards";
import type { ContentId, LearnerLesson, LearnerUnit } from "../../../shared/content/contracts/learnerContent";
import { contentFailure, contentSuccess } from "../../../shared/content/errors/contentErrors";
import LessonPlayer from "../../lesson/LessonPlayer";
import { resolveExplicitTeacherPreview } from "./teacherPreviewResolver";
import { getDraftLesson, getPublishedLesson } from "./teacherPreviewSources";
import { PreviewTerminalState } from "./PreviewTerminalState";
import { buildStudentPreviewUrl, previewTarget, safePreviewReturnTo } from "./previewNavigation";
import { previewLayoutContract, previewViewportStyle, type PreviewViewportMode } from "./previewViewport";
import { PreviewLoadingState } from "./PreviewLoadingState";
import StudentPreviewShell from "./StudentPreviewShell";

export default function StudentPreviewLessonPage() {
  const { courseId = "", lessonId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [viewportMode, setViewportMode] = useState<PreviewViewportMode>("desktop");
  const returnPath = safePreviewReturnTo(searchParams.get("returnTo"), `/admin/courses/${courseId}?tab=curriculum`);
  const target = previewTarget(searchParams.get("preview"));
  const previewCoursePath = buildStudentPreviewUrl({ courseId, target, returnTo: returnPath });
  const validId = isDecimalContentId(lessonId) ? lessonId as unknown as ContentId : null;
  const resource = useLearnerResource<{ lesson: LearnerLesson; unit: LearnerUnit; source: "draft" | "published" }>(async (signal) => {
    if (!validId) return contentFailure("not_found", "Lesson not found.");
    void signal;
    const resolved = await resolveExplicitTeacherPreview(target, () => getDraftLesson(validId), () => getPublishedLesson(validId));
    if (resolved.status !== "ready") return contentFailure(resolved.status === "error" ? "unexpected" : "unavailable", resolved.status === "error" ? "The lesson preview encountered an unexpected problem. Retry or return to the Studio." : `No saved ${target} Lesson content was found.`, resolved.status === "error");
    const lesson = resolved.value;
    const unit = {
      id: lesson.unitId,
      courseId: lesson.courseId,
      title: "Course unit",
      description: "",
      position: 0,
      lessonCount: 1,
      lessons: [],
    };
    return contentSuccess({ lesson, unit, source: resolved.source }, "preview");
  }, [validId, target]);

  if (!resource.loading && !resource.value) return <PreviewTerminalState courseId={courseId} error={resource.error} onRetry={resource.retry} returnPath={returnPath} />;
  if (!resource.value) return <PreviewLoadingState returnPath={returnPath} />;
  const { lesson, unit, source } = resource.value;
  const layout = previewLayoutContract(viewportMode);
  return <StudentPreviewShell returnPath={returnPath} source={source} viewportMode={viewportMode} onViewportModeChange={setViewportMode}><div className="mx-auto min-w-0 overflow-x-hidden" style={previewViewportStyle(viewportMode)}><LessonPlayer key={`${target}:${lesson.id}`} lesson={lesson} returnPath={previewCoursePath} contextLabel={unit.title} runtimeMode="teacher_preview" layoutMode={layout.lessonMode} /></div></StudentPreviewShell>;
}
