import Card from "../../../shared/components/ui/Card";
import ProgressBar from "../../../shared/components/ui/ProgressBar";
import { useNavigate } from "react-router-dom";

type Props = {
  courseTitle: string;
  unitTitle: string;
  lessonTitle?: string;
  progress: number;
  lessonId?: number;
};

function ContinueLearningCard({
  courseTitle,
  unitTitle,
  lessonTitle,
  progress,
  lessonId,
}: Props) {

  const navigate = useNavigate();

  function handleContinue() {
    if (lessonId !== undefined) {
      navigate(`/lessons/${lessonId}`);
      return;
    }

    navigate("/courses");
  }

  return (
    <Card title={courseTitle}>

      <p className="mt-1 text-sm text-slate-500">
        {unitTitle}
      </p>

      {lessonTitle && (
        <p className="mt-1 text-sm text-slate-600">
          {lessonTitle}
        </p>
      )}

      <ProgressBar value={progress} />

      <div className="mt-4 flex items-center justify-between">

        <span className="text-sm text-slate-500">
          {progress}% completed
        </span>

        <button
          onClick={handleContinue}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Continue →
        </button>

      </div>

    </Card>
  );
}

export default ContinueLearningCard;
