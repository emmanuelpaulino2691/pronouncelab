import { Link, useNavigate, useParams } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import ProgressBar from "../../shared/components/ui/ProgressBar";
import NotFoundState from "../../shared/components/ui/NotFoundState";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { isDecimalContentId } from "../../shared/content/contracts/publishedRpcGuards";
import type { ContentId, LearnerCourse, LearnerUnit } from "../../shared/content/contracts/learnerContent";
import { contentFailure, contentSuccess } from "../../shared/content/errors/contentErrors";
import { loadUserProgress } from "../../shared/utils/progressStorage";
import { loadLessonState } from "../../shared/utils/lessonStorage";
import { normalizeLessonState } from "../lesson/studentExperience";
import { resolveLearnerLessonState, resolveLearnerUnitState, resolveRecommendedLearnerStep } from "../learner-journey/learnerJourney";
import LessonJourneyCard from "./components/LessonJourneyCard";

type UnitContext = { unit: LearnerUnit; course: LearnerCourse };

export default function LessonsPage() {
  const { unitId = "" } = useParams();
  const navigate = useNavigate();
  const validId = isDecimalContentId(unitId) ? unitId as unknown as ContentId : null;
  const resource = useLearnerResource<UnitContext>(async (signal) => {
    if (!validId) return contentFailure("not_found", "Unit not found.");
    const unitResult = await learnerContentProvider.getUnit(validId, signal);
    if (!unitResult.ok) return unitResult;
    const courseResult = await learnerContentProvider.getCourse(unitResult.value.courseId, signal);
    if (!courseResult.ok) return courseResult;
    return contentSuccess({ unit: unitResult.value, course: courseResult.value }, unitResult.revision);
  }, [validId]);

  if (!resource.loading && resource.error?.code !== "not_found") return <MainLayout><section className="rounded-2xl border border-red-200 bg-white p-6"><h1 className="text-2xl font-bold">Lessons could not be loaded</h1><p className="mt-2 text-slate-600">This unit is temporarily unavailable.</p><button type="button" onClick={resource.retry} className="mt-5 min-h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white">Try again</button></section></MainLayout>;
  if (!resource.loading && !resource.value) return <MainLayout><NotFoundState title="Unit not found" message="This unit does not exist or is no longer available." actionLabel="Browse Courses" onAction={() => navigate("/courses")} /></MainLayout>;
  if (!resource.value) return <MainLayout><p role="status">Loading your lessons...</p></MainLayout>;

  const { unit, course } = resource.value;
  const progress = loadUserProgress();
  const activityPositions = Object.fromEntries(unit.lessons.map((lesson) => [lesson.id, normalizeLessonState(loadLessonState(lesson.id), lesson.activityCount).currentActivity]));
  const unitJourney = resolveLearnerUnitState(unit, progress);
  const lessonJourneys = unit.lessons.map((lesson) => resolveLearnerLessonState(lesson, progress, activityPositions[lesson.id]));
  const recommended = resolveRecommendedLearnerStep([course], progress, activityPositions, { unitId: unit.id });
  const recommendedJourney = recommended ? lessonJourneys.find((journey) => journey.lesson.id === recommended.lesson.id) : undefined;
  const otherJourneys = recommendedJourney ? lessonJourneys.filter((journey) => journey.lesson.id !== recommendedJourney.lesson.id) : lessonJourneys;

  return <MainLayout>
    <nav aria-label="Unit navigation"><Link to={`/courses/${course.id}`} className="inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">&larr; {course.title}</Link></nav>
    <header className="mt-3 max-w-4xl"><p className="text-sm font-semibold text-slate-500">{course.title}</p><h1 className="mt-1 break-words text-3xl font-bold text-slate-950 sm:text-4xl">{unit.title}</h1>{unit.description.trim() && <p className="mt-3 text-lg leading-7 text-slate-600">{unit.description}</p>}</header>
    {unitJourney.state === "empty" ? <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7"><h2 className="text-2xl font-bold text-slate-950">No lessons are available in this unit yet.</h2><p className="mt-2 text-slate-600">Return to the course to choose another unit.</p><Link to={`/courses/${course.id}`} className="mt-5 inline-flex min-h-11 items-center font-semibold text-blue-700 hover:underline">Return to course</Link></section> : <>
      <section aria-labelledby="unit-progress-heading" className="mt-8 max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Unit progress</p><h2 id="unit-progress-heading" className="mt-1 text-xl font-bold text-slate-950">{unitJourney.completedLessons} of {unitJourney.totalLessons} lessons completed</h2><div className="mt-3"><ProgressBar value={unitJourney.percent} label={`${unit.title} progress`} /></div>{unitJourney.state === "completed" && <p className="mt-3 font-semibold text-emerald-700">You completed every available lesson in this unit.</p>}</section>
      <div className="mt-10 space-y-10">
        {recommendedJourney && <section aria-labelledby="recommended-lesson-heading"><h2 id="recommended-lesson-heading" className="mb-4 text-xl font-bold text-slate-950">{unitJourney.state === "completed" ? "Review a lesson" : "Recommended next lesson"}</h2><LessonJourneyCard journey={recommendedJourney} recommended /></section>}
        {otherJourneys.length > 0 && <section aria-labelledby="all-lessons-heading"><h2 id="all-lessons-heading" className="text-xl font-bold text-slate-950">All lessons</h2><div className="mt-4 grid gap-5 md:grid-cols-2">{otherJourneys.map((journey) => <LessonJourneyCard key={journey.lesson.id} journey={journey} recommended={false} />)}</div></section>}
      </div>
    </>}
  </MainLayout>;
}
