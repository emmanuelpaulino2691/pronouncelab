import StatCard from "../../../shared/components/ui/StatCard";

type Props = {
  streak: number;
  badges: number;
  studyHours: number;
};

function StatsSection({
  streak,
  badges,
  studyHours,
}: Props) {
  return (
    <>
      <StatCard
        title="Daily Streak"
        value={`🔥 ${streak}`}
        color="text-orange-500"
      />

      <StatCard
        title="Badges"
        value={`🏆 ${badges}`}
        color="text-yellow-500"
      />

      <StatCard
        title="Study Time"
        value={`${studyHours} h`}
        color="text-blue-600"
      />
    </>
  );
}

export default StatsSection;