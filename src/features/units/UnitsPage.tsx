import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import { courses } from "../../shared/data/courses";
import { units } from "../../shared/data/units";

function UnitsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const course = courses.find(
    (course) => course.id === Number(courseId)
  );

  const courseUnits = units.filter(
    (unit) => unit.courseId === Number(courseId)
  );

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold">
        {course?.emoji} {course?.title}
      </h1>

      <p className="mt-2 text-slate-600">
        Select the unit you want to study.
      </p>

      <div className="mt-6 space-y-4">
        {courseUnits.map((unit) => (
  <Card key={unit.id} title={unit.title}>
    <p>{unit.description}</p>

    <button
      onClick={() => navigate(`/units/${unit.id}`)}
      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
    >
      Open Unit
    </button>
  </Card>
))}
      </div>
    </MainLayout>
  );
}

export default UnitsPage;