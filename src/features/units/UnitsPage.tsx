import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import NotFoundState from "../../shared/components/ui/NotFoundState";

import {
  getCourse,
  getPlayableLessonsByUnit,
  getUnitsByCourse,
} from "../../shared/services/courseEngineService";

function UnitsPage() {

  const { courseId } = useParams();

  const navigate = useNavigate();

  const course = getCourse(Number(courseId));

  const units = getUnitsByCourse(Number(courseId));

  if (!course) {
    return (
      <MainLayout>
        <NotFoundState
          title="Course not found"
          message="This course does not exist or is no longer available."
          actionLabel="Browse Courses"
          onAction={() => navigate("/courses")}
        />
      </MainLayout>
    );
  }

  return (

    <MainLayout>

      <h1 className="text-4xl font-bold">
        {course?.emoji} {course?.title}
      </h1>

      <p className="mt-2 text-slate-600">
        Choose a unit.
      </p>

      <div className="mt-8 grid gap-6">

        {units.map((unit) => {
          const hasLessons =
            getPlayableLessonsByUnit(
              unit.id
            ).length > 0;

          return (
            <Card
              key={unit.id}
              title={unit.title}
            >

              <p>
                {unit.description}
              </p>

              {hasLessons ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/units/${unit.id}`)
                  }
                  className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Open Unit →
                </button>
              ) : (
                <p
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
                >
                  <span aria-hidden="true">○</span>
                  Coming Soon
                </p>
              )}

            </Card>
          );
        })}


      </div>

    </MainLayout>

  );
}

export default UnitsPage;
