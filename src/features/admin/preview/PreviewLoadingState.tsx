import MainLayout from "../../../shared/layouts/MainLayout";
import { StudentPreviewToolbar } from "./StudentPreviewToolbar";

export function PreviewLoadingState({ returnPath }: { returnPath: string }) {
  return <><StudentPreviewToolbar returnPath={returnPath} /><MainLayout><section role="status" aria-label="Loading Student Preview" className="mx-auto max-w-4xl space-y-5 py-8"><div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" /><div className="h-12 w-3/4 animate-pulse rounded-xl bg-slate-200" /><div className="h-24 animate-pulse rounded-2xl bg-slate-200" /><div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" /><span className="sr-only">Loading Student Preview…</span></section></MainLayout></>;
}
