import ActivityLayout from "../../../shared/components/activity/ActivityLayout";

import TheoryActivity from "../shared/TheoryActivity";

function TheoryPage() {
  return (
    <ActivityLayout>
      {(lesson) => <TheoryActivity lesson={lesson} />}
    </ActivityLayout>
  );
}

export default TheoryPage;