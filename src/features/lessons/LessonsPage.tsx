import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";

import { getLessonsByUnit } from "../../shared/services/courseEngineService";

function LessonsPage() {

  const { unitId } = useParams();

  const navigate = useNavigate();

  const lessons =
    getLessonsByUnit(Number(unitId));

  return (

    <MainLayout>

      <h1 className="text-4xl font-bold">
        Lessons
      </h1>

      <p className="mt-2 text-slate-600">
        Continue your learning.
      </p>

      <div className="mt-8 grid gap-6">

        {lessons.map((lesson) => (

          <Card
            key={lesson.id}
            title={lesson.title}
          >

            <p>
              {lesson.description}
            </p>

            <button
              onClick={() =>
                navigate(`/lessons/${lesson.id}`)
              }
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              Start Lesson →
            </button>

          </Card>

        ))}

      </div>

    </MainLayout>

  );
}

export default LessonsPage;
