import Card from "../../../shared/components/ui/Card";
import ProgressBar from "../../../shared/components/ui/ProgressBar";

type Props = {
  courseTitle: string;
  unitTitle: string;
  progress: number;
};

function ContinueLearningCard({
  courseTitle,
  unitTitle,
  progress,
}: Props) {
    function handleContinue() {
  alert("Opening your last lesson...");
}
  return (
    <Card title="Continue Learning">
      <p className="font-medium text-slate-700">
        {courseTitle}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {unitTitle}
      </p>

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