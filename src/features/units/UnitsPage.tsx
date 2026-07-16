import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";

import {
  getCourse,
  getUnitsByCourse,
} from "../../shared/services/courseEngineService";

function UnitsPage() {

  const { courseId } = useParams();

  const navigate = useNavigate();

  const course = getCourse(Number(courseId));

  const units = getUnitsByCourse(Number(courseId));

  return (

    <MainLayout>

      <h1 className="text-4xl font-bold">
        {course?.emoji} {course?.title}
      </h1>

      <p className="mt-2 text-slate-600">
        Choose a unit.
      </p>

      <div className="mt-8 grid gap-6">

        {units.map((unit) => (

          <Card
            key={unit.id}
            title={unit.title}
          >

            <p>
              {unit.description}
            </p>

            <button
              onClick={() =>
                navigate(`/units/${unit.id}`)
              }
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              Open Unit →
            </button>

          </Card>

        ))}

      </div>

    </MainLayout>

  );
}

export default UnitsPage;
