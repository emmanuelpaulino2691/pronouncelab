import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { buildPublishedProgress } from "../../shared/content/progressCompatibility";
import { loadUserProgress } from "../../shared/utils/progressStorage";
import ContinueLearningCard from "./components/ContinueLearningCard";
import CourseProgressCard from "./components/CourseProgressCard";
import ProgressStats from "./components/ProgressStats";
import RecentUnitsSection from "./components/RecentUnitsSection";
import UserStatsCard from "./components/UserStatsCard";

function DashboardPage() {
  const resource = useLearnerResource((signal) => learnerContentProvider.listCourses(signal), []);
  const stored = loadUserProgress();
  const courses = resource.value ?? [];
  const lessons = courses.flatMap((course) => course.units.flatMap((unit) => unit.lessons));
  const progress = buildPublishedProgress(lessons, stored);
  const current = progress.continueLessonProgress;
  const context = current ? courses.flatMap((course) => course.units.map((unit) => ({ course, unit, lesson: unit.lessons.find((lesson) => lesson.id === current.lessonId) }))).find((item) => item.lesson) : undefined;

  return <MainLayout>
    <h1 className="text-4xl font-bold">Welcome back 👋</h1>
    {resource.loading && <p className="mt-6" role="status">Loading your published courses…</p>}
    {resource.error && <Card title="Learning content could not be loaded"><p>{resource.error.message}</p><button type="button" onClick={resource.retry} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">Try again</button></Card>}
    <div className="mt-6 grid gap-6 lg:grid-cols-4">
      <ContinueLearningCard courseId={context?.course.id} courseTitle={context?.course.title ?? "Published Courses"} unitTitle={context?.unit.title ?? "Start learning"} lessonTitle={context?.lesson?.title} progress={current?.percent ?? 0} lessonId={current?.lessonId} />
      <CourseProgressCard lessonsStarted={progress.lessonsStarted} lessonsCompleted={progress.lessonsCompleted} completionRate={progress.completionRate} />
      <ProgressStats lessonsStarted={progress.lessonsStarted} lessonsCompleted={progress.lessonsCompleted} completionRate={progress.completionRate} completedActivities={progress.completedActivities} />
      <UserStatsCard />
    </div>
    <div className="mt-8"><RecentUnitsSection units={context ? [{ id: context.unit.id, title: context.unit.title, completed: current?.percent === 100 }] : []} /></div>
  </MainLayout>;
}

export default DashboardPage;
