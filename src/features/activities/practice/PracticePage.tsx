import ActivityLayout from "../../../shared/components/activity/ActivityLayout";

import PracticeActivity from "../shared/PracticeActivity";

function PracticePage() {
  return (
    <ActivityLayout>
      {(lesson) => <PracticeActivity lesson={lesson} />}
    </ActivityLayout>
  );
}

export default PracticePage;