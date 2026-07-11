import ActivityLayout from "../../../shared/components/activity/ActivityLayout";

import ListeningActivity from "../shared/ListeningActivity";

function ListeningPage() {
  return (
    <ActivityLayout>
      {(lesson) => <ListeningActivity lesson={lesson} />}
    </ActivityLayout>
  );
}

export default ListeningPage;