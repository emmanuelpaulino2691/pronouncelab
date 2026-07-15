import { useGlobalProgress } from "../../../shared/hooks/useGlobalProgress";
import StatCard from "../../../shared/components/ui/StatCard";

function ProgressStats() {
  const {
    lessonsStarted,
    lessonsCompleted,
    completionRate,
    completedActivities,
  } = useGlobalProgress();

  return (
    <>
      <StatCard
        title="Lessons Started"
        value={String(lessonsStarted)}
        color="text-blue-600"
      />

      <StatCard
        title="Lessons Completed"
        value={String(lessonsCompleted)}
        color="text-green-600"
      />

      <StatCard
        title="Activities Completed"
        value={String(completedActivities)}
        color="text-purple-600"
      />

      <StatCard
        title="Completion Rate"
        value={`${completionRate}%`}
        color="text-orange-600"
      />
    </>
  );
}

export default ProgressStats;
