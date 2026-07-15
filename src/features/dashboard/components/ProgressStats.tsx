import { useGlobalProgress } from "../../../shared/hooks/useGlobalProgress";
import StatCard from "../../../shared/components/ui/StatCard";

function ProgressStats() {
  const {
    lessonsStarted,
    lessonsCompleted,
    completionRate,
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
        title="Completion"
        value={`${completionRate}%`}
        color="text-purple-600"
      />
    </>
  );
}

export default ProgressStats;