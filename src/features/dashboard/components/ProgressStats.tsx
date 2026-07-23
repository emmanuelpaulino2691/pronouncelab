import StatCard from "../../../shared/components/ui/StatCard";

type Props = { lessonsStarted: number; lessonsCompleted: number; completionRate: number; completedActivities: number };

function ProgressStats({ lessonsStarted, lessonsCompleted, completionRate, completedActivities }: Props) {

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
