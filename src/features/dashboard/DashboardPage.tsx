import MainLayout from "../../shared/layouts/MainLayout";

import ContinueLearningCard from "./components/ContinueLearningCard";
import ProgressStats from "./components/ProgressStats";
import CourseProgressCard from "./components/CourseProgressCard";
import RecentUnitsSection from "./components/RecentUnitsSection";

import { useGlobalProgress } from "../../shared/hooks/useGlobalProgress";
import { getLessonSummary } from "../../shared/services/courseEngineService";
import { getUnit } from "../../shared/services/courseEngineService";

function DashboardPage() {
  const {
    lessonProgress,
    continueLessonId,
  } = useGlobalProgress();

  const lastLesson =
    lessonProgress[
      lessonProgress.length - 1
    ];

  const lesson =
    lastLesson
      ? getLessonSummary(
          lastLesson.lessonId
        )
      : undefined;

  const unit =
    lesson
      ? getUnit(lesson.unitId)
      : undefined;

  const recentUnits = unit
    ? [
        {
          id: unit.id,
          title: unit.title,
          completed:
            lastLesson?.percent === 100,
        },
      ]
    : [];

  return (
    <MainLayout>
      <h1 className="text-3xl font-bold">
        Welcome back ??
      </h1>

      <div className="grid gap-6 lg:grid-cols-3 mt-6">

        <ContinueLearningCard
          courseTitle={
            "Pronunciation Course"
          }
          unitTitle={
            unit?.title ??
            "Start learning"
          }
          progress={
        lastLesson?.percent ?? 0
      }
      lessonId={continueLessonId}
        />

        <CourseProgressCard />

        <ProgressStats />

      </div>

      <div className="mt-8">
        <RecentUnitsSection
          units={recentUnits}
        />
      </div>

    </MainLayout>
  );
}

export default DashboardPage;

