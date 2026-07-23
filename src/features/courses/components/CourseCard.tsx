import { useNavigate } from "react-router-dom";

import Card from "../../../shared/components/ui/Card";
import ProgressBar from "../../../shared/components/ui/ProgressBar";

type Props = {
  id: string;
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

  return (

    <Card title={`${emoji} ${title}`}>

      <div className="space-y-4">

        <div className="flex justify-between text-sm">

          <span className="rounded-full bg-slate-100 px-3 py-1">
            {level}
          </span>

          <span>
            {units} Units
          </span>

        </div>

        <ProgressBar value={progress} />

        <div className="flex items-center justify-between">

          <span className="text-sm text-slate-500">
            {progress}% completed
          </span>

          <button
            type="button"
            onClick={() => navigate(`/courses/${id}`)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Open →
          </button>

        </div>

      </div>

    </Card>

  );
}

export default CourseCard;
