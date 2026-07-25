import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../../shared/layouts/MainLayout";
import NotFoundState from "../../../shared/components/ui/NotFoundState";
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

export default function StudentPreviewLessonPage() {
  const { courseId = "", lessonId = "" } = useParams();
  const navigate = useNavigate();
  const validId = isDecimalContentId(lessonId) ? lessonId as unknown as ContentId : null;
  const resource = useLearnerResource<{ lesson: LearnerLesson; unit: LearnerUnit; source: "draft" | "published" | "local" }>(async (signal) => {
    if (!validId) return contentFailure("not_found", "Lesson not found.");
    const resolved = await resolveTeacherPreviewLesson(validId, { draft: { getLesson: getDraftLesson }, published: learnerContentProvider, local: staticLearnerContentProvider }, signal);
    if (resolved.status !== "ready") return contentFailure(resolved.status === "forbidden" ? "unavailable" : "not_found", resolved.status === "not_found" ? "No saved draft, published version, or local lesson content was found." : "This lesson is not available for preview.");
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

  if (!resource.loading && !resource.value) return <MainLayout><NotFoundState title="Preview unavailable" message={resource.error?.message ?? "This lesson is not available for preview."} actionLabel="Return to curriculum" onAction={() => navigate(`/admin/courses/${courseId}`)} /></MainLayout>;
  if (!resource.value) return <MainLayout><p role="status" className="p-8">Loading Student Preview…</p></MainLayout>;
  const { lesson, unit, source } = resource.value;
  return <><StudentPreviewToolbar returnPath={`/admin/courses/${courseId}`} draft={source === "draft"} source={source} /><MainLayout immersive><LessonPlayer key={lesson.id} lesson={lesson} returnPath={`/admin/courses/${courseId}`} contextLabel={unit.title} runtimeMode="teacher_preview" /></MainLayout></>;
}
