import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import { getCourseById } from "../../shared/services/courseService";
import { getUnitsByCourse } from "../../shared/services/unitService";

function UnitsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const course = getCourseById(Number(courseId));

  const courseUnits = getUnitsByCourse(Number(courseId));

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