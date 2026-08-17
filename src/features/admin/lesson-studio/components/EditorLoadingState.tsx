import { editorLoadingLabel } from "./lazyEditorUi";

export default function EditorLoadingState() {
  return <section role="status" aria-label={editorLoadingLabel} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="h-5 w-40 animate-pulse rounded bg-slate-200" /><div className="h-11 animate-pulse rounded-xl bg-slate-100" /><div className="h-24 animate-pulse rounded-xl bg-slate-100" /><span className="sr-only">{editorLoadingLabel}…</span></section>;
}
