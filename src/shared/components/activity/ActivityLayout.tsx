import type { ReactNode } from "react";
import { useParams } from "react-router-dom";

import MainLayout from "../../layouts/MainLayout";
import { getLesson } from "../../services/courseEngineService";

type Props = {
  children: (lesson: NonNullable<ReturnType<typeof getLesson>>) => ReactNode;
};

function ActivityLayout({ children }: Props) {
  const { lessonId } = useParams();

  const lesson = getLesson(Number(lessonId));

  if (!lesson) {
    return <MainLayout>Lesson not found.</MainLayout>;
  }

  return <MainLayout>{children(lesson)}</MainLayout>;
}

export default ActivityLayout;
