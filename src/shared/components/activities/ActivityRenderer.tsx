import type { LessonActivity } from "../../types/LessonActivity";
import type { LessonData } from "../../types/LessonData";

type Props = {
  activity: LessonActivity;
  lesson: LessonData;
};

function ActivityRenderer({ activity }: Props) {
  return (
    <div>
      {activity.title} ({activity.type})
    </div>
  );
}

export default ActivityRenderer;