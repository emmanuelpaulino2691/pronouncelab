import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import { getLesson } from "../../shared/services/lessonService";

function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const lesson = getLesson(Number(lessonId));

const activities = lesson?.activities ?? [];

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold">
        Lesson {lessonId}
      </h1>

      <p className="mt-2 text-slate-600">
        Select an activity.
      </p>

      <div className="mt-6 space-y-4">
        {activities.map((activity) => (
          <Card
  key={activity.id}
  title={activity.title}
>
  <button
    onClick={() => navigate(`/${activity.type}/${lessonId}`)}
    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
  >
    Open Activity
  </button>
</Card>
        ))}
      </div>
    </MainLayout>
  );
}

export default LessonPage;