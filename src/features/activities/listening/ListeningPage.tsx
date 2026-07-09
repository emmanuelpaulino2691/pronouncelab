import ActivityLayout from "../../../shared/components/activity/ActivityLayout";

import ListeningCard from "../../../shared/components/listening/ListeningCard";

function ListeningPage() {
  return (
    <ActivityLayout>
      {(lesson) => (
        <>
          <h1 className="text-3xl font-bold">
            {lesson.title}
          </h1>

          <p className="mt-2 text-slate-600">
            Listening Activity
          </p>

          <div className="mt-6 space-y-4">
            {(lesson.listening ?? []).map((item) => (
              <ListeningCard
                key={item.id}
                listening={item}
              />
            ))}
          </div>
        </>
      )}
    </ActivityLayout>
  );
}

export default ListeningPage;