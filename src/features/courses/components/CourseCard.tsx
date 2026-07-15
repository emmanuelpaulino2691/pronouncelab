import Card from "../../../shared/components/ui/Card";
import ProgressBar from "../../../shared/components/ui/ProgressBar";
import { useNavigate } from "react-router-dom";

type Props = {
  id: number;
  title: string;
  level: string;
  units: number;
  emoji: string;
  progress: number;
};

function CourseCard({
  id,
  title,
  level,
  units,
  emoji,
  progress,
}: Props) {

  const navigate = useNavigate();

  function handleOpenCourse() {
    navigate(`/courses/${id}`);
  }

  return (
    <Card title={`${emoji} ${title}`}>

      <p>
        {level}
      </p>

      <p className="mt-2 text-slate-500">
        {units} Units
      </p>

      <div className="mt-4">
        <ProgressBar value={progress} />
      </div>

      <p className="mt-2 text-sm text-slate-500">
        {progress}% completed
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
