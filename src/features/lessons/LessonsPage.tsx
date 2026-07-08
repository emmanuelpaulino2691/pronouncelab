import { useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import { lessons } from "../../shared/data/lessons";

function LessonsPage() {
  const { unitId } = useParams();

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
            <p>Start Lesson</p>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}

export default LessonsPage;