import { Link } from "react-router-dom";
import MainLayout from "../../../shared/layouts/MainLayout";
import type { ContentProviderError } from "../../../shared/content/errors/contentErrors";
import { StudentPreviewToolbar } from "./StudentPreviewToolbar";

type Props = {
  courseId: string;
  error: ContentProviderError | null;
  onRetry: () => void;
  returnPath: string;
};

export function PreviewTerminalState({ courseId, error, onRetry, returnPath }: Props) {
  const studioPath = returnPath.includes("/studio") ? returnPath : null;
  const title = error?.code === "forbidden" ? "Preview access unavailable" : "Preview could not be loaded";
  const message = error?.message ?? "No saved draft, published version, or local content is available for this preview.";
  return <>
    <StudentPreviewToolbar returnPath={returnPath} />
    <MainLayout>
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 leading-7 text-slate-600">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={onRetry} className="min-h-11 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Try again</button>
          {studioPath && <Link to={studioPath} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-center font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Return to Lesson Studio</Link>}
          <Link to={`/admin/courses/${courseId}?tab=curriculum`} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-center font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Return to Curriculum</Link>
          <Link to={returnPath} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-center font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Exit Preview</Link>
        </div>
      </section>
    </MainLayout>
  </>;
}
