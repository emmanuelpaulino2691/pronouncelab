import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import NotFoundState from "../../shared/components/ui/NotFoundState";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { isDecimalContentId } from "../../shared/content/contracts/publishedRpcGuards";
import type { ContentId } from "../../shared/content/contracts/learnerContent";

function UnitsPage() {
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
  return <MainLayout>
    <h1 className="text-4xl font-bold">{course.emoji} {course.title}</h1>
    <p className="mt-2 text-slate-600">Choose a unit.</p>
    <div className="mt-8 grid gap-6">
      {course.units.length === 0 && <Card title="No published units"><p>This course does not have published units yet.</p></Card>}
      {course.units.map((unit) => <Card key={unit.id} title={unit.title}>
        <p>{unit.description}</p>
        {unit.lessons.length > 0 ? <button type="button" onClick={() => navigate(`/units/${unit.id}`)} className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white">Open Unit →</button> : <p className="mt-5 text-sm font-semibold text-slate-700">No published lessons yet</p>}
      </Card>)}
    </div>
  </MainLayout>;
}

export default UnitsPage;
