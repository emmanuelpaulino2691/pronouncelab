import { useNavigate, useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import Card from "../../shared/components/ui/Card";
import NotFoundState from "../../shared/components/ui/NotFoundState";

import {
  getLessonsByUnit,
  getPlayableLessonsByUnit,
  getUnit,
} from "../../shared/services/courseEngineService";
import { loadUserProgress } from "../../shared/utils/progressStorage";

type LessonStatus =
  | "Not Started"
  | "In Progress"
  | "Completed";

function LessonsPage() {

  const { unitId } = useParams();

  const navigate = useNavigate();

  const unit = getUnit(Number(unitId));

  const lessons =
    getLessonsByUnit(Number(unitId));

  const playableLessons =
    getPlayableLessonsByUnit(
      Number(unitId)
    );

  const playableLessonIds =
    new Set(
      playableLessons.map(
        (lesson) => lesson.id
      )
    );

  const progress = loadUserProgress();

  if (!unit) {
    return (
      <MainLayout>
        <NotFoundState
          title="Unit not found"
          message="This unit does not exist or is no longer available."
          actionLabel="Browse Courses"
          onAction={() => navigate("/courses")}
        />
      </MainLayout>
    );
  }

  function getLessonStatus(
    lessonId: number
  ): LessonStatus {
    if (
      progress.lessonsCompleted.includes(
        lessonId
      )
    ) {
      return "Completed";
    }

    if (
      progress.lessonsStarted.includes(
        lessonId
      )
    ) {
      return "In Progress";
    }

    return "Not Started";
  }

  return (

    <MainLayout>

      <h1 className="text-4xl font-bold">
        {unit.title}
      </h1>

      <p className="mt-2 text-slate-600">
        Continue your learning.
      </p>

      <div className="mt-8 grid gap-6">

        {playableLessons.length === 0 && (
          <Card title="Coming Soon">
            <p>
              Lessons for this unit are not available yet.
            </p>
          </Card>
        )}

        {lessons.map((lesson) => {
          const isPlayable =
            playableLessonIds.has(lesson.id);

          if (!isPlayable) {
            return (
              <Card
                key={lesson.id}
                title={lesson.title}
              >
                <p>
                  {lesson.description}
                </p>

                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  <span aria-hidden="true">○</span>
                  Coming Soon
                </p>
              </Card>
            );
          }

          const status =
            getLessonStatus(lesson.id);

          const action =
            status === "Completed"
              ? "Review"
              : status === "In Progress"
              ? "Continue"
              : "Start";

          return (
            <Card
              key={lesson.id}
              title={lesson.title}
            >

              <p>
                {lesson.description}
              </p>

              <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
                >
                  <span aria-hidden="true">
                    {status === "Completed"
                      ? "✓"
                      : status === "In Progress"
                      ? "▶"
                      : "○"}
                  </span>
                  {status}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/lessons/${lesson.id}`
                    )
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {action}
                </button>
              </div>

            </Card>
          );
        })}

      </div>

    </MainLayout>

  );
}

export default LessonsPage;
