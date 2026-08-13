import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import ProgressBar from "../../shared/components/ui/ProgressBar";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { useUserProgress } from "../../shared/hooks/useUserProgress";
import { loadLessonState } from "../../shared/utils/lessonStorage";
import { normalizeLessonState } from "../lesson/studentExperience";
import DashboardLoadingState from "./components/DashboardLoadingState";
import NextActionCard from "./components/NextActionCard";
import { buildCurrentCourseSummary, getHomeWelcomeHeading, hasCompletedEveryAvailableLesson, hasLearnerProgress, resolveNextLearnerAction } from "./learnerDashboard";

export default function DashboardPage() {
  const { progress: stored } = useUserProgress();
  const navigate = useNavigate();
  const resource = useLearnerResource((signal) => learnerContentProvider.listCourses(signal), []);
  const courses = resource.value ?? [];
  const activityPositions = Object.fromEntries(courses.flatMap((course) => course.units.flatMap((unit) => unit.lessons.map((lesson) => [lesson.id, normalizeLessonState(loadLessonState(lesson.id), lesson.activityCount).currentActivity]))));
  const action = resolveNextLearnerAction(courses, stored, activityPositions);
  const currentCourse = action ? buildCurrentCourseSummary(action, stored) : null;
  const returningLearner = hasLearnerProgress(stored);
  const everythingCompleted = hasCompletedEveryAvailableLesson(courses, stored);

  return <MainLayout>
    <header>
      <h1 className="break-words text-3xl font-bold text-slate-950 sm:text-4xl">{getHomeWelcomeHeading()}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-7 text-slate-600">Ready to continue your English journey?</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A few focused minutes can make English feel more familiar.</p>
    </header>

    {resource.loading && <DashboardLoadingState />}
    {resource.error && <section className="mt-8 rounded-2xl border border-red-200 bg-white p-6" aria-labelledby="home-error-heading"><h2 id="home-error-heading" className="text-xl font-bold text-slate-950">Your learning content could not be loaded</h2><p className="mt-2 text-slate-600">Your place remains safe on this device. Try loading Home again.</p><button type="button" onClick={resource.retry} className="mt-5 min-h-11 rounded-xl bg-blue-600 px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Try again</button></section>}

    {!resource.loading && !resource.error && !action && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7" aria-labelledby="empty-mission-heading"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Today&apos;s Mission</p><h2 id="empty-mission-heading" className="mt-3 text-2xl font-bold text-slate-950">No lessons are available yet</h2><p className="mt-2 max-w-xl leading-7 text-slate-600">New English journeys are being prepared. Please check back later.</p>{courses.length > 0 && <button type="button" onClick={() => navigate("/courses")} className="mt-5 min-h-11 rounded-xl border border-blue-600 px-5 font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Browse Courses</button>}</section>}

    {!resource.loading && !resource.error && action && <div className="mt-8 space-y-10">
      <section aria-labelledby="todays-mission-heading"><h2 id="todays-mission-heading" className="sr-only">Today&apos;s Mission</h2><NextActionCard action={action} returningLearner={returningLearner} everythingCompleted={everythingCompleted} /></section>

      {currentCourse && <section aria-labelledby="learning-journey-heading" className="max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Your Learning Journey</p>
        <h2 id="learning-journey-heading" className="mt-2 text-2xl font-bold text-slate-950">{currentCourse.courseTitle}</h2>
        <p className="mt-1 text-slate-600">Current unit: {currentCourse.unitTitle}</p>
        <div className="mt-5"><p className="mb-2 text-sm text-slate-600">{currentCourse.completedLessons} of {currentCourse.totalLessons} lessons completed</p><ProgressBar value={currentCourse.percent} label={`${currentCourse.courseTitle} progress`} /></div>
        <button type="button" onClick={() => navigate(`/courses/${currentCourse.courseId}`)} className="mt-5 min-h-11 rounded-xl border border-blue-600 px-5 font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Open Course</button>
        <Link to="/courses" className="mt-4 inline-flex min-h-11 items-center font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Browse all courses <span aria-hidden="true">&rarr;</span></Link>
      </section>}
    </div>}
  </MainLayout>;
}
