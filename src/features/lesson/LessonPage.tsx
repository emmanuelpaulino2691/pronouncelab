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
} from "../../shared/services/courseEngineService";

import LessonPlayer from "./LessonPlayer";

function LessonPage() {
  const { lessonId } = useParams();

  const navigate = useNavigate();

  const lesson = getLesson(Number(lessonId));
  const lessonSummary =
    getLessonSummary(Number(lessonId));
  const unit =
    lessonSummary
      ? getUnit(lessonSummary.unitId)
      : undefined;

  if (!lesson || !lessonSummary || !unit) {
    return (
      <MainLayout>
        <NotFoundState
          title="Lesson not found"
          message="This lesson does not exist or is no longer available."
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
    <MainLayout>
      <LessonPlayer lesson={lesson} />
    </MainLayout>
  );
}

export default LessonPage;
