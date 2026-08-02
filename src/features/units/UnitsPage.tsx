import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import NotFoundState from "../../shared/components/ui/NotFoundState";
import ProgressBar from "../../shared/components/ui/ProgressBar";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { isDecimalContentId } from "../../shared/content/contracts/publishedRpcGuards";
import type { ContentId } from "../../shared/content/contracts/learnerContent";
import { loadUserProgress } from "../../shared/utils/progressStorage";
import { getCourseUnitProgress, recommendedUnitIndex, unitActionLabel } from "./courseUnitProgress";

export default function UnitsPage() {
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const validId = isDecimalContentId(courseId) ? courseId as unknown as ContentId : null;
  const resource = useLearnerResource(
    (signal) => validId ? learnerContentProvider.getCourse(validId, signal) : Promise.resolve({ ok: false as const, error: { code: "not_found" as const, message: "Course not found.", retryable: false } }),
    [validId]
  );

  if (!resource.loading && resource.error?.code !== "not_found") return <MainLayout><Card title="Course could not be loaded"><p>{resource.error?.message}</p><button type="button" onClick={resource.retry} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">Try again</button></Card></MainLayout>;
  if (!resource.loading && !resource.value) return <MainLayout><NotFoundState title="Course not found" message="This course does not exist or is no longer published." actionLabel="Browse Courses" onAction={() => navigate("/courses")} /></MainLayout>;
  if (!resource.value) return <MainLayout><p role="status">Loading published course…</p></MainLayout>;

  const course = resource.value;
  const storedProgress = loadUserProgress();
  const unitProgress = course.units.map((unit) => getCourseUnitProgress(unit.lessons.map((lesson) => lesson.id), storedProgress.lessonsCompleted));
  const recommendedIndex = recommendedUnitIndex(unitProgress);

  return <MainLayout>
    <h1 className="break-words text-3xl font-bold sm:text-4xl">{course.emoji} {course.title}</h1>
    <p className="mt-2 text-slate-600">Continue with the recommended unit or review any available lesson.</p>
    <div className="mt-8 grid gap-6">
      {course.units.length === 0 && <Card title="No published units"><p>This course does not have published units yet.</p></Card>}
      {course.units.map((unit, index) => <Card key={unit.id} title={unit.title}>
        <p>{unit.description}</p>
        {unit.lessons.length > 0 ? <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-semibold text-slate-700">{unitProgress[index].completedLessons} of {unitProgress[index].totalLessons} lessons completed</span>{index === recommendedIndex && unitProgress[index].state !== "completed" && <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">Recommended next</span>}</div>
          <div className="mt-3"><ProgressBar value={unitProgress[index].percent} label={`${unit.title} progress`} /></div>
          <button type="button" onClick={() => navigate(`/units/${unit.id}`)} className="mt-5 min-h-11 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{unitActionLabel(unitProgress[index])} →</button>
        </> : <p className="mt-5 text-sm font-semibold text-slate-700">No published lessons yet</p>}
      </Card>)}
    </div>
  </MainLayout>;
}
