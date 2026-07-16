import MainLayout from "../../shared/layouts/MainLayout";

import ContinueLearningCard from "./components/ContinueLearningCard";
import CourseProgressCard from "./components/CourseProgressCard";
import ProgressStats from "./components/ProgressStats";
import RecentUnitsSection from "./components/RecentUnitsSection";
import UserStatsCard from "./components/UserStatsCard";

import { useGlobalProgress } from "../../shared/hooks/useGlobalProgress";
import {
  getLessonSummary,
  getUnit,
} from "../../shared/services/courseEngineService";

function DashboardPage() {

  const { lessonProgress } =
    useGlobalProgress();

  const lastLesson =
    lessonProgress.at(-1);

  const lesson =
    lastLesson
      ? getLessonSummary(lastLesson.lessonId)
      : undefined;

  const unit =
    lesson
      ? getUnit(lesson.unitId)
      : undefined;

  const recentUnits =
    unit
      ? [{
          id: unit.id,
          title: unit.title,
          completed:
            lastLesson?.percent === 100,
        }]
      : [];

  return (

    <MainLayout>

      <h1 className="text-4xl font-bold">
        Welcome back 👋
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">

        <ContinueLearningCard
          courseTitle="Pronunciation Course"
          unitTitle={
            unit?.title ??
            "Start learning"
          }
          progress={
            lastLesson?.percent ?? 0
          }
        />

        <CourseProgressCard />

        <ProgressStats />

        <UserStatsCard />

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
