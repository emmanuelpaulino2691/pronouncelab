import Card from "../../../shared/components/ui/Card";
import { useNavigate } from "react-router-dom";

type Props = {
  id: number;
  title: string;
  level: string;
  units: number;
  emoji: string;
};

function CourseCard({
  id,
  title,
  level,
  units,
  emoji,
}: Props) {

  const navigate = useNavigate();

  function handleOpenCourse() {
  navigate(`/courses/${id}`);
}
  return (
    <Card title={`${emoji} ${title}`}>
      <p className="text-slate-600">
        {level}
      </p>

      <p className="mt-2 text-slate-500">
        {units} Units
      </p>

      <button
  onClick={handleOpenCourse}
  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
>
        Open Course
      </button>
    </Card>
  );
}

export default CourseCard;