import MainLayout from "../../shared/layouts/MainLayout";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { useUserProgress } from "../../shared/hooks/useUserProgress";
import { loadLessonState } from "../../shared/utils/lessonStorage";
import { normalizeLessonState } from "../lesson/studentExperience";
import { resolveLearnerCourseState, resolveRecommendedLearnerStep } from "../learner-journey/learnerJourney";
import CourseCard from "./components/CourseCard";

export default function CoursesPage() {
  const { progress } = useUserProgress();
  const resource = useLearnerResource((signal) => learnerContentProvider.listCourses(signal), []);
  const courses = resource.value ?? [];
  const activityPositions = Object.fromEntries(courses.flatMap((course) => course.units.flatMap((unit) => unit.lessons.map((lesson) => [lesson.id, normalizeLessonState(loadLessonState(lesson.id), lesson.activityCount).currentActivity]))));
  const recommended = resolveRecommendedLearnerStep(courses, progress, activityPositions);
  const journeys = courses.map((course) => resolveLearnerCourseState(course, progress));
  const orderedJourneys = recommended ? [...journeys].sort((a, b) => Number(b.course.id === recommended.course.id) - Number(a.course.id === recommended.course.id)) : journeys;

  return <MainLayout>
    <header><h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Your Courses</h1><p className="mt-2 max-w-2xl leading-7 text-slate-600">Choose a learning journey or continue the one already in progress.</p></header>
    {resource.loading && <div role="status" className="mt-8 space-y-5"><div className="h-56 animate-pulse rounded-2xl bg-white" /><div className="grid gap-5 md:grid-cols-2"><div className="h-48 animate-pulse rounded-2xl bg-white" /><div className="h-48 animate-pulse rounded-2xl bg-white" /></div><span className="sr-only">Loading your courses...</span></div>}
    {resource.error && <section className="mt-8 rounded-2xl border border-red-200 bg-white p-6"><h2 className="text-xl font-bold text-slate-950">Courses could not be loaded</h2><p className="mt-2 text-slate-600">Your learning journeys are temporarily unavailable.</p><button type="button" onClick={resource.retry} className="mt-5 min-h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white">Try again</button></section>}
    {!resource.loading && !resource.error && courses.length === 0 && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7"><h2 className="text-2xl font-bold text-slate-950">New learning journeys are being prepared.</h2><p className="mt-2 text-slate-600">Please check back when new courses are available.</p></section>}
    {!resource.loading && !resource.error && orderedJourneys.length > 0 && <div className="mt-8 space-y-8">
      {recommended && <section aria-labelledby="recommended-course-heading"><h2 id="recommended-course-heading" className="sr-only">Recommended course</h2><CourseCard journey={orderedJourneys[0]} recommended /></section>}
      {orderedJourneys.length > (recommended ? 1 : 0) && <section aria-labelledby="available-courses-heading"><h2 id="available-courses-heading" className="text-xl font-bold text-slate-950">{recommended ? "Other available courses" : "Available courses"}</h2><div className="mt-4 grid gap-5 md:grid-cols-2">{orderedJourneys.slice(recommended ? 1 : 0).map((journey) => <CourseCard key={journey.course.id} journey={journey} recommended={false} />)}</div></section>}
    </div>}
  </MainLayout>;
}
