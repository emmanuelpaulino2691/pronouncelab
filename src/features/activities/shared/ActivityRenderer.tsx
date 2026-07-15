import { activityRegistry } from "./activityRegistry";

import type { LessonActivity } from "../../../shared/types/LessonActivity";
import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  activity: LessonActivity;
  lesson: LessonData;
};

function ActivityRenderer({
  activity,
  lesson,
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
      lesson={lesson}
    />
  );
}

export default ActivityRenderer;
