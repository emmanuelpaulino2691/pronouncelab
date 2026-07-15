import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import ProgressBar from "../../shared/components/ui/ProgressBar";

import {
  getCourse,
  getUnitsByCourse,
  getUnitProgress,
} from "../../shared/services/courseEngineService";

import { loadUserProgress } from "../../shared/utils/progressStorage";

function UnitsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const id = Number(courseId);

  const course = getCourse(id);

  const courseUnits =
    getUnitsByCourse(id);

  const progress =
    loadUserProgress();

  return (
    <MainLayout>

      <h1 className="text-3xl font-bold">
        {course?.emoji} {course?.title}
      </h1>

      <p className="mt-2 text-slate-600">
        Select the unit you want to study.
      </p>

      <div className="mt-6 space-y-4">

        {courseUnits.map((unit) => {

          const unitProgress =
            getUnitProgress(
              unit.id,
              progress.lessonsCompleted
            );

          return (
            <Card
              key={unit.id}
              title={unit.title}
            >

              <p>
                {unit.description}
              </p>

              <div className="mt-4">
                <ProgressBar
                  value={unitProgress}
                />
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {unitProgress}% completed
              </p>

              <button
                onClick={() =>
                  navigate(
                    `/units/${unit.id}`
                  )
                }
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                Open Unit
              </button>

            </Card>
          );
        })}

      </div>

    </MainLayout>
  );
}

export default UnitsPage;
