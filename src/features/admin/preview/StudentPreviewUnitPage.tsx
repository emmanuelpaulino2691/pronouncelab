import { Link, useParams, useSearchParams } from "react-router-dom";
import { useLearnerResource } from "../../../shared/content/hooks/useLearnerResource";
import { contentFailure, contentSuccess } from "../../../shared/content/errors/contentErrors";
import { getDraftCourse, getPublishedCourse } from "./teacherPreviewSources";
import { buildStudentPreviewUrl, previewTarget, safePreviewReturnTo } from "./previewNavigation";
import StudentPreviewShell from "./StudentPreviewShell";

export default function StudentPreviewUnitPage() {
  const { courseId = "", unitId = "" } = useParams();
  const [params] = useSearchParams();
  const target = previewTarget(params.get("preview"));
  const returnTo = safePreviewReturnTo(params.get("returnTo"), `/admin/courses/${courseId}/units/${unitId}`);
  const resource = useLearnerResource(async () => {
    const course = await (target === "published" ? getPublishedCourse(courseId as never) : getDraftCourse(courseId as never));
    const unit = course?.units.find((item) => String(item.id) === unitId);
    return course && unit ? contentSuccess({ course, unit }, "preview") : contentFailure("unavailable", `No saved ${target} Unit content was found.`);
  }, [courseId, unitId, target]);

  if (!resource.value) return <StudentPreviewShell returnPath={returnTo} source={target}><section className="mx-auto max-w-4xl py-8" role={resource.loading ? "status" : "alert"}>{resource.loading ? "Loading Student Preview…" : resource.error?.message}</section></StudentPreviewShell>;
  const { course, unit } = resource.value;
  return <StudentPreviewShell returnPath={returnTo} source={target}><section className="mx-auto max-w-4xl space-y-6 py-8"><header><p className="text-sm font-bold uppercase text-blue-700">{target === "published" ? "Published Preview" : "Draft Preview"}</p><h1 className="mt-2 text-4xl font-bold">{unit.title}</h1><p className="mt-2 text-slate-600">{course.title}</p></header><ul className="space-y-3">{unit.lessons.map((lesson) => <li key={lesson.id} className="rounded-xl border bg-white p-4"><Link className="font-semibold text-blue-700 underline" to={buildStudentPreviewUrl({ courseId, lessonId: lesson.id, target, returnTo })}>{lesson.title}</Link></li>)}</ul><Link className="font-semibold text-blue-700 underline" to={buildStudentPreviewUrl({ courseId, target, returnTo })}>Back to Course Preview</Link></section></StudentPreviewShell>;
}
