import Card from "../../../shared/components/ui/Card";
import ProgressBar from "../../../shared/components/ui/ProgressBar";
import { useNavigate } from "react-router-dom";

type Props = {
  courseId?: string;
  courseTitle: string;
  unitTitle: string;
  lessonTitle?: string;
  progress: number;
  lessonId?: string;
};

function ContinueLearningCard({
  courseId,
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

        <span className="text-sm text-slate-500">
          {progress}% completed
        </span>

        <div className="flex flex-wrap gap-2">
          {courseId && (
            <button
              type="button"
              onClick={() => navigate(`/courses/${courseId}`)}
              className="rounded-lg border border-blue-600 px-4 py-2 text-blue-600 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              View Course
            </button>
          )}

          <button
            type="button"
            onClick={handleContinue}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Continue →
          </button>
        </div>
      </div>

    </Card>
  );
}

export default ContinueLearningCard;
