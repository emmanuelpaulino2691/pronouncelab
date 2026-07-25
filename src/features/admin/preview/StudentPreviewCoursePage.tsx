import { Link, useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../../shared/layouts/MainLayout";
import NotFoundState from "../../../shared/components/ui/NotFoundState";
import { learnerContentProvider } from "../../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../../shared/content/hooks/useLearnerResource";
import { isDecimalContentId } from "../../../shared/content/contracts/publishedRpcGuards";
import type { ContentId } from "../../../shared/content/contracts/learnerContent";
import { contentFailure } from "../../../shared/content/errors/contentErrors";
import { StudentPreviewToolbar } from "./StudentPreviewToolbar";
import { resolveTeacherPreviewCourse } from "./teacherPreviewResolver";
import { getDraftCourse } from "./teacherPreviewSources";
import { staticLearnerContentProvider } from "../../../shared/content/providers/staticLearnerContentProvider";

export default function StudentPreviewCoursePage() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const validId = isDecimalContentId(courseId) ? courseId as unknown as ContentId : null;
  const resource = useLearnerResource(async (signal) => {
    if (!validId) return contentFailure("not_found", "Course not found.");
    const resolved = await resolveTeacherPreviewCourse(validId, { draft: { getCourse: getDraftCourse }, published: learnerContentProvider, local: staticLearnerContentProvider }, signal);
    return resolved.status === "ready"
      ? { ok: true as const, value: { course: resolved.value, source: resolved.source }, revision: "preview" }
      : contentFailure(resolved.status === "forbidden" ? "unavailable" : "not_found", "No saved draft, published version, or local course content was found.");
  }, [validId]);

  if (!resource.loading && !resource.value) {
    return <MainLayout><NotFoundState title="Preview unavailable" message={resource.error?.message ?? "This course is not available for preview."} actionLabel="Return to course" onAction={() => navigate(`/admin/courses/${courseId}`)} /></MainLayout>;
  }
  if (!resource.value) return <MainLayout><p role="status" className="p-8">Loading Student Preview...</p></MainLayout>;

  const { course, source } = resource.value;
  return <>
    <StudentPreviewToolbar returnPath={`/admin/courses/${courseId}`} source={source} />
    <MainLayout>
      <section className="mx-auto max-w-4xl space-y-7 py-8">
        <header>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">{source === "draft" ? "Draft Preview" : source === "local" ? "Local Content Preview" : "Published Preview"}</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">{course.emoji} {course.title}</h1>
          <p className="mt-3 text-slate-600">{course.description}</p>
        </header>
        {course.units.map((unit) => <section key={unit.id} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">{unit.title}</h2>
          <ul className="mt-4 space-y-2">{unit.lessons.map((lesson) => <li key={lesson.id}><Link className="text-blue-700 underline" to={`/admin/preview/courses/${courseId}/lessons/${lesson.id}`}>{lesson.title}</Link></li>)}</ul>
        </section>)}
      </section>
    </MainLayout>
  </>;
}
