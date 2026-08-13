import { Link, useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import ProgressBar from "../../shared/components/ui/ProgressBar";
import NotFoundState from "../../shared/components/ui/NotFoundState";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { isDecimalContentId } from "../../shared/content/contracts/publishedRpcGuards";
import { hasLearnerLoadFailure } from "../../shared/content/learnerResourcePresentation";
import type { ContentId } from "../../shared/content/contracts/learnerContent";
import { useUserProgress } from "../../shared/hooks/useUserProgress";
import { resolveLearnerCourseState, resolveRecommendedLearnerStep, resolveSequentialUnitJourneys } from "../learner-journey/learnerJourney";
import UnitJourneyCard from "./components/UnitJourneyCard";

export default function UnitsPage() {
  const { progress } = useUserProgress();
  const { courseId = "" } = useParams();
  const navigate = useNavigate();
  const validId = isDecimalContentId(courseId) ? courseId as unknown as ContentId : null;
  const resource = useLearnerResource((signal) => validId ? learnerContentProvider.getCourse(validId, signal) : Promise.resolve({ ok: false as const, error: { code: "not_found" as const, message: "Course not found.", retryable: false } }), [validId]);

  if (hasLearnerLoadFailure(resource.loading, resource.error)) return <MainLayout><section className="rounded-2xl border border-red-200 bg-white p-6"><h1 className="text-2xl font-bold">Course could not be loaded</h1><p className="mt-2 text-slate-600">This learning journey is temporarily unavailable.</p><button type="button" onClick={resource.retry} className="mt-5 min-h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white">Try again</button></section></MainLayout>;
  if (!resource.loading && !resource.value) return <MainLayout><NotFoundState title="Course not found" message="This course does not exist or is no longer available." actionLabel="Browse Courses" onAction={() => navigate("/courses")} /></MainLayout>;
  if (!resource.value) return <MainLayout><p role="status">Loading your course...</p></MainLayout>;

  const course = resource.value;
  const courseJourney = resolveLearnerCourseState(course, progress);
  const unitJourneys = resolveSequentialUnitJourneys(course, progress);
  const recommended = resolveRecommendedLearnerStep([course], progress, {}, { courseId: course.id });
  const recommendedJourney = recommended ? unitJourneys.find((journey) => journey.unit.id === recommended.unit.id) : undefined;

  return <MainLayout>
    <nav aria-label="Course navigation"><Link to="/courses" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">&larr; Your Courses</Link></nav>
    <header className="mt-3 max-w-4xl"><h1 className="break-words text-3xl font-bold text-slate-950 sm:text-4xl">{course.title}</h1>{course.description.trim() && <p className="mt-3 text-lg leading-7 text-slate-600">{course.description}</p>}</header>
    {courseJourney.state === "empty" ? <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7"><h2 className="text-2xl font-bold text-slate-950">This course does not have lessons available yet.</h2><p className="mt-2 text-slate-600">Browse another learning journey while new lessons are prepared.</p><Link to="/courses" className="mt-5 inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Browse other courses</Link></section> : <>
      <section aria-labelledby="course-progress-heading" className="mt-8 max-w-4xl"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Course progress</p><h2 id="course-progress-heading" className="mt-1 text-xl font-bold text-slate-950">{courseJourney.completedLessons} of {courseJourney.totalLessons} lessons completed</h2></div>{courseJourney.state === "completed" && <p className="font-semibold text-emerald-700">You completed every available lesson in this course.</p>}</div><div className="mt-3"><ProgressBar value={courseJourney.percent} label={`${course.title} progress`} /></div></section>
      <div className="mt-10 space-y-10">
        {recommendedJourney && <section aria-labelledby="recommended-unit-heading"><h2 id="recommended-unit-heading" className="mb-4 text-xl font-bold text-slate-950">{courseJourney.state === "completed" ? "Review a unit" : "Recommended next unit"}</h2><UnitJourneyCard journey={recommendedJourney} recommended /></section>}
        {unitJourneys.length > 0 && <section aria-labelledby="all-units-heading"><h2 id="all-units-heading" className="text-xl font-bold text-slate-950">All units</h2><div className="mt-4 grid gap-5 md:grid-cols-2">{unitJourneys.map((journey) => <UnitJourneyCard key={journey.unit.id} journey={journey} recommended={false} />)}</div></section>}
        {courseJourney.state === "completed" && <Link to="/courses" className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Browse other courses</Link>}
      </div>
    </>}
  </MainLayout>;
}
