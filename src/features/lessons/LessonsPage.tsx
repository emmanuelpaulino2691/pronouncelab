import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import { lessons } from "../../shared/data/lessons";

function LessonsPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();

  const unitLessons = lessons.filter(
    (lesson) => lesson.unitId === Number(unitId)
  );

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold">
        Lessons
      </h1>

      <p className="mt-2 text-slate-600">
        Select a lesson.
      </p>

      <div className="mt-6 space-y-4">
  {unitLessons.map((lesson) => (
    <Card key={lesson.id} title={lesson.title}>
      <button
        onClick={() => navigate(`/lessons/${lesson.id}`)}
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