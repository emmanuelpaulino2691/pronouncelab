import type { ReactNode } from "react";
import { useParams } from "react-router-dom";

import MainLayout from "../../layouts/MainLayout";
import { getLesson } from "../../services/lessonService";

type Props = {
  children: (lesson: ReturnType<typeof getLesson>) => ReactNode;
};

function ActivityLayout({ children }: Props) {
  const { lessonId } = useParams();

  const lesson = getLesson(Number(lessonId));

  if (!lesson) {
    return (
      <MainLayout>
        <h1 className="text-3xl font-bold">Lesson not found</h1>
      </MainLayout>
    );
  }

  return <MainLayout>{children(lesson)}</MainLayout>;
}

export default ActivityLayout;