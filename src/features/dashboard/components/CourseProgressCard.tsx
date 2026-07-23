import Card from "../../../shared/components/ui/Card";
import ProgressBar from "../../../shared/components/ui/ProgressBar";
type Props = { lessonsStarted: number; lessonsCompleted: number; completionRate: number };

function CourseProgressCard({ lessonsStarted, lessonsCompleted, completionRate }: Props) {

  return (
    <Card title="Course Progress">

      <div className="space-y-4">

        <div className="flex justify-between text-sm">
          <span>Lessons Started</span>
          <span className="font-semibold">
            {lessonsStarted}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Lessons Completed</span>
          <span className="font-semibold">
            {lessonsCompleted}
          </span>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Completion</span>
            <span className="font-semibold">
              {completionRate}%
            </span>
          </div>

          <ProgressBar value={completionRate} />

        </div>

      </div>

    </Card>
  );
}

export default CourseProgressCard;
