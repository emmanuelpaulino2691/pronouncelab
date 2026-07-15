import ListeningCard from "../../../shared/components/listening/ListeningCard";

import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function ListeningActivity({ lesson }: Props) {
  return (
    <div className="space-y-4">
      {(lesson.listening ?? []).map((item, index) => (
        <ListeningCard
          key={index}
          listening={item}
        />
      ))}
    </div>
  );
}

export default ListeningActivity;
