import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import ProgressBar from "../../shared/components/ui/ProgressBar";

import {
  getLessonsByUnit,
} from "../../shared/services/courseEngineService";

import {
  loadUserProgress,
} from "../../shared/utils/progressStorage";

import {
  getLesson,
} from "../../shared/services/courseEngineService";

function LessonsPage() {
  const { unitId } = useParams();

  const navigate = useNavigate();

  const lessons =
    getLessonsByUnit(
      Number(unitId)
    );

  const progress =
    loadUserProgress();

  return (
    <MainLayout>

      <h1 className="text-3xl font-bold">
        Lessons
      </h1>

      <p className="mt-2 text-slate-600">
        Select a lesson to continue learning.
      </p>

      <div className="mt-6 space-y-4">

        {lessons.map((lesson) => {

          const lessonData =
            getLesson(
              lesson.id
            );

          const totalActivities =
            lessonData?.activities.length ?? 0;

          const completedActivities =
            progress.activitiesCompleted.find(
              (item) =>
                item.lessonId === lesson.id
            )?.activities.length ?? 0;

          const percent =
            totalActivities === 0
              ? 0
              : Math.round(
                  (completedActivities /
                    totalActivities) *
                    100
                );

          const status =
            percent === 100
              ? "Completed"
              : percent > 0
              ? "In Progress"
              : "Not Started";

          return (

            <Card
              key={lesson.id}
              title={lesson.title}
            >

              <p>
                {lesson.description}
              </p>

              <div className="mt-4">
                <ProgressBar
                  value={percent}
                />
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {status} · {percent}%
              </p>

              <button
                onClick={() =>
                  navigate(
                    `/lessons/${lesson.id}`
                  )
                }
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              >
                Open Lesson
              </button>

            </Card>

          );
        })}

      </div>

    </MainLayout>
  );
}

export default LessonsPage;

