import { activityRegistry } from "./activityRegistry";

import type { LessonActivity } from "../../../shared/types/LessonActivity";
import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  activity: LessonActivity;
  lesson: LessonData;
  onReadyChange: (ready: boolean) => void;
};

function ActivityRenderer({
  activity,
  lesson,
  onReadyChange,
}: Props) {
  const ActivityComponent =
    activityRegistry[activity.type];

  if (!ActivityComponent) {
    return (
      <div>
        Activity not supported
      </div>
    );
  }

  return (
    <ActivityComponent
      key={`${lesson.id}-${activity.id}`}
      activity={activity}
      lesson={lesson}
      onReadyChange={onReadyChange}
    />
  );
}

export default ActivityRenderer;
