import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import NotFoundState from "../../shared/components/ui/NotFoundState";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { isDecimalContentId } from "../../shared/content/contracts/publishedRpcGuards";
import type { ContentId } from "../../shared/content/contracts/learnerContent";
import { loadUserProgress } from "../../shared/utils/progressStorage";

type LessonStatus = "Not Started" | "In Progress" | "Completed";

function LessonsPage() {
  const { unitId = "" } = useParams();
  const navigate = useNavigate();
  const validId = isDecimalContentId(unitId) ? unitId as unknown as ContentId : null;
  const resource = useLearnerResource(
    (signal) => validId ? learnerContentProvider.getUnit(validId, signal) : Promise.resolve({ ok: false as const, error: { code: "not_found" as const, message: "Unit not found.", retryable: false } }),
    [validId]
  );
  const progress = loadUserProgress();

  if (!resource.loading && resource.error?.code !== "not_found") return <MainLayout><Card title="Lessons could not be loaded"><p>{resource.error?.message}</p><button type="button" onClick={resource.retry} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">Try again</button></Card></MainLayout>;
  if (!resource.loading && !resource.value) return <MainLayout><NotFoundState title="Unit not found" message="This unit does not exist or is no longer published." actionLabel="Browse Courses" onAction={() => navigate("/courses")} /></MainLayout>;
  if (!resource.value) return <MainLayout><p role="status">Loading published lessons…</p></MainLayout>;

  const unit = resource.value;
  const statusFor = (id: string): LessonStatus => progress.lessonsCompleted.includes(id) ? "Completed" : progress.lessonsStarted.includes(id) ? "In Progress" : "Not Started";

  return <MainLayout>
    <h1 className="text-4xl font-bold">{unit.title}</h1>
    <p className="mt-2 text-slate-600">Continue your learning.</p>
    <div className="mt-8 grid gap-6">
      {unit.lessons.length === 0 && <Card title="No published lessons"><p>Lessons for this unit are not available yet.</p></Card>}
      {unit.lessons.map((lesson) => {
        const status = statusFor(lesson.id);
        const action = status === "Completed" ? "Review" : status === "In Progress" ? "Continue" : "Start";
        return <Card key={lesson.id} title={lesson.title}>
          <p>{lesson.description}</p>
          <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{status === "Completed" ? "✓" : status === "In Progress" ? "▶" : "○"} {status}</p>
            <button type="button" onClick={() => navigate(`/lessons/${lesson.id}`)} className="rounded-lg bg-blue-600 px-5 py-2 text-white">{action}</button>
          </div>
        </Card>;
      })}
    </div>
  </MainLayout>;
}

export default LessonsPage;
