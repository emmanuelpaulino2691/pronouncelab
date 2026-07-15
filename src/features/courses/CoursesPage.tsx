import MainLayout from "../../shared/layouts/MainLayout";
import CourseCard from "./components/CourseCard";

import { getCourses } from "../../shared/services/courseEngineService";

function CoursesPage() {
  const courses = getCourses();

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold text-slate-800">
        Courses
      </h1>

      <p className="mt-2 text-slate-600">
        Choose a course to continue learning.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            id={course.id}
            title={course.title}
            level={course.level}
            units={course.units.length}
            emoji={course.emoji}
          />
        ))}
      </div>
    </MainLayout>
  );
}

export default CoursesPage;