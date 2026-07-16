import ProgressBar from "../../../shared/components/ui/ProgressBar";

type Props = {
  title: string;
  description: string;
  activity: string;
  current: number;
  total: number;
  progress: number;
};

function LessonHeader({
  title,
  description,
  activity,
  current,
  total,
  progress,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <p className="text-sm font-medium text-blue-600">
        Lesson
      </p>

      <h1 className="mt-1 text-3xl font-bold">
        {title}
      </h1>

      <p className="mt-2 text-slate-600">
        {description}
      </p>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <span>
            Activity {current} of {total}
          </span>

          <span>
            {progress}%
          </span>
        </div>

        <ProgressBar value={progress} />
      </div>

      <div className="mt-6 rounded-lg bg-slate-100 px-4 py-3">

        <p className="text-xs uppercase tracking-wide text-slate-500">
          Current Activity
        </p>

        <p className="text-lg font-semibold">
          {activity}
        </p>

      </div>

    </div>
  );
}

export default LessonHeader;
