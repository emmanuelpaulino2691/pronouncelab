import ActivitySection from "./ActivitySection";
import { activityRegistry } from "./activityRegistry";

import type { LessonActivity } from "../../../shared/types/LessonActivity";
import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  activity: LessonActivity;
  lesson: LessonData;
};

function ActivityRenderer({ activity, lesson }: Props) {
  const Activity =
    activityRegistry[activity.type];

  return (
    <ActivitySection title={activity.title}>
      <Activity lesson={lesson} />
    </ActivitySection>
  );
}

export default ActivityRenderer;