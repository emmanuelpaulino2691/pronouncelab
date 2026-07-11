import { useParams } from "react-router-dom";

import MainLayout from "../../shared/layouts/MainLayout";
import { getLesson } from "../../shared/services/lessonService";

import LessonPlayer from "./LessonPlayer";

function LessonPage() {
  const { lessonId } = useParams();

  const lesson = getLesson(Number(lessonId));

  if (!lesson) {
    return (
      <MainLayout>
        <h1 className="text-3xl font-bold">
          Lesson not found
        </h1>
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