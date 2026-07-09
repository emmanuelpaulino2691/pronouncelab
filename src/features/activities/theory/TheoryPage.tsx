import ActivityLayout from "../../../shared/components/activity/ActivityLayout";
import TheoryRenderer from "../../../shared/components/theory/TheoryRenderer";

function TheoryPage() {
  return (
    <ActivityLayout>
      {(lesson) => (
        <>
          <h1 className="text-3xl font-bold">
            {lesson.title}
          </h1>

          <TheoryRenderer blocks={lesson.theory} />
        </>
      )}
    </ActivityLayout>
  );
}

export default TheoryPage;