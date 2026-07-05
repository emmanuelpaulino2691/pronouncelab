import MainLayout from "../../shared/layouts/MainLayout";

import ContinueLearningCard from "./components/ContinueLearningCard";
import StatsSection from "./components/StatsSection";
import RecentUnitsSection from "./components/RecentUnitsSection";

import { dashboardData } from "../../shared/data/dashboard";

function DashboardPage() {
  return (
    <MainLayout>
      <h2 className="mb-8 text-3xl font-bold">
        Welcome back, {dashboardData.studentName} 👋
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ContinueLearningCard
          courseTitle={dashboardData.currentCourse.title}
          unitTitle={dashboardData.currentCourse.unit}
          progress={dashboardData.currentCourse.progress}
        />

        <StatsSection
          streak={dashboardData.streak}
          badges={dashboardData.badgesEarned}
          studyHours={dashboardData.studyHours}
        />
      </div>
      <RecentUnitsSection
  units={dashboardData.recentUnits}
/>
    </MainLayout>
  );
}

export default DashboardPage;