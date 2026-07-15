import MainLayout from "../../shared/layouts/MainLayout";

import ContinueLearningCard from "./components/ContinueLearningCard";
import ProgressStats from "./components/ProgressStats";
import CourseProgressCard from "./components/CourseProgressCard";
import RecentUnitsSection from "./components/RecentUnitsSection";

import { dashboardData } from "../../shared/data/dashboard";

function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Welcome back, {dashboardData.studentName} 👋
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <ContinueLearningCard
            courseTitle={dashboardData.currentCourse.title}
            unitTitle={dashboardData.currentCourse.unit}
            progress={dashboardData.currentCourse.progress}
          />

          <CourseProgressCard />

          <ProgressStats />
        </div>

        <RecentUnitsSection
          units={dashboardData.recentUnits}
        />
      </div>
    </MainLayout>
  );
}

export default DashboardPage;