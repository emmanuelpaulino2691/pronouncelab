import { Link } from "react-router-dom";
import ProgressBar from "../../../shared/components/ui/ProgressBar";

type Props = {
  title: string; description: string; current: number; total: number;
  progress: number; remainingMinutes: number | null; returnPath: string;
};

export default function LessonHeader({ title, description, current, total, progress, remainingMinutes, returnPath }: Props) {
  return <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link to={returnPath} className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">← Exit lesson</Link>
        <p className="text-sm font-semibold text-slate-700">Activity {current} of {total}</p>
        <p className="text-sm text-slate-500">{progress}%<span className="hidden sm:inline">{remainingMinutes === null ? "" : ` · About ${remainingMinutes} min left`}</span></p>
      </div>
      <div className="mt-3"><ProgressBar value={progress} /></div>
      <div className="mt-5 min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">PronounceLab lesson</p>
        <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl" title={title}>{title || "Untitled lesson"}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
    </div>
  </header>;
}
