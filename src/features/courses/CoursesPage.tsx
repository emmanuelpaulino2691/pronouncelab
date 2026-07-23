import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { progressForPublishedLessons } from "../../shared/content/progressCompatibility";
import { loadUserProgress } from "../../shared/utils/progressStorage";
import CourseCard from "./components/CourseCard";

function CoursesPage() {
  const resource = useLearnerResource(
    (signal) => learnerContentProvider.listCourses(signal),
    []
  );
  const progress = loadUserProgress();

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold">Courses</h1>
      <p className="mt-2 text-slate-600">Choose a course to continue learning.</p>

      {resource.loading && <p className="mt-6" role="status">Loading published courses…</p>}
      {resource.error && (
        <Card title="Courses could not be loaded">
          <p>{resource.error.message}</p>
          <button type="button" onClick={resource.retry} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white">Try again</button>
        </Card>
      )}
      {!resource.loading && !resource.error && resource.value?.length === 0 && (
        <Card title="No published courses yet"><p>Published courses will appear here when they are available.</p></Card>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resource.value?.map((course) => {
          const lessonIds = course.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
          return <CourseCard key={course.id} id={course.id} title={course.title} level={course.level} units={course.units.length} emoji={course.emoji} progress={progressForPublishedLessons(progress.lessonsCompleted, lessonIds)} />;
        })}
      </div>
    </MainLayout>
  );
}

export default CoursesPage;
