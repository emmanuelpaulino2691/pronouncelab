import Card from "../../../shared/components/ui/Card";
import { useUserStats } from "../../../shared/hooks/useUserStats";

function UserStatsCard() {

  const { stats } = useUserStats();

  return (

    <Card title="Your Progress">

      <div className="space-y-4">

        <div className="flex justify-between">
          <span>Level</span>
          <strong>{stats.level}</strong>
        </div>

        <div className="flex justify-between">
          <span>XP</span>
          <strong>{stats.xp}</strong>
        </div>

        <div className="flex justify-between">
          <span>Streak</span>
          <strong>{stats.streak} 🔥</strong>
        </div>

      </div>

    </Card>

  );

}

export default UserStatsCard;
