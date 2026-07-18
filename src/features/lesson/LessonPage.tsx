import {
  useNavigate,
  useParams,
} from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import NotFoundState from "../../shared/components/ui/NotFoundState";
import {
  getLesson,
  getLessonSummary,
  getUnit,
  isLessonPlayable,
} from "../../shared/services/courseEngineService";

import LessonPlayer from "./LessonPlayer";

function LessonPage() {
  const { lessonId } = useParams();

  const navigate = useNavigate();

  const lessonSummary =
    getLessonSummary(Number(lessonId));
  const unit =
    lessonSummary
      ? getUnit(lessonSummary.unitId)
      : undefined;
  const playable =
    isLessonPlayable(Number(lessonId));
  const lesson =
    playable
      ? getLesson(Number(lessonId))
      : undefined;

  if (
    !playable ||
    !lesson ||
    !lessonSummary ||
    !unit
  ) {
    return (
      <MainLayout>
        <NotFoundState
          title={
            lessonSummary
              ? "Lesson unavailable"
              : "Lesson not found"
          }
          message={
            lessonSummary
              ? "This lesson is coming soon."
              : "This lesson does not exist or is no longer available."
          }
          actionLabel={
            unit
              ? "Back to Lessons"
              : "Browse Courses"
          }
          onAction={() =>
            navigate(
              unit
                ? `/units/${unit.id}`
                : "/courses"
            )
          }
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout immersive>
      <LessonPlayer
        key={lesson.id}
        lesson={lesson}
        returnPath={`/units/${unit.id}`}
        contextLabel={unit.title}
      />
    </MainLayout>
  );
}

export default LessonPage;
