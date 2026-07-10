import ActivityLayout from "../../../shared/components/activity/ActivityLayout";
import PracticeCard from "../../../shared/components/practice/PracticeCard";

function PracticePage() {
  return (
    <ActivityLayout>
      {(lesson) => (
        <>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>

          <p className="mt-2 text-slate-600">
            Practice Activity
          </p>

          <div className="mt-6 space-y-4">
            {(lesson.practice ?? []).map((practice) => (
              <PracticeCard
                key={practice.id}
                practice={practice}
              />
            ))}
          </div>
        </>
      )}
    </ActivityLayout>
  );
}

export default PracticePage;