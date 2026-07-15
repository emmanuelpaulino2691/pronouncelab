import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";

import { getLessonsByUnit } from "../../shared/services/courseEngineService";

function LessonsPage() {
  const { unitId } = useParams();

  const navigate = useNavigate();

  const lessons = getLessonsByUnit(Number(unitId));

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold">
        Lessons
      </h1>

      <p className="mt-2 text-slate-600">
        Select a lesson.
      </p>

      <div className="mt-6 space-y-4">
        {lessons.map((lesson) => (
          <Card
            key={lesson.id}
            title={lesson.title}
          >
            <button
              onClick={() =>
                navigate(`/lessons/${lesson.id}`)
              }
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              Open Lesson
            </button>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}

export default LessonsPage;