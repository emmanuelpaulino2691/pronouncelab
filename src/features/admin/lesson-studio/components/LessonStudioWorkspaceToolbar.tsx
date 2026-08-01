import type { ActivitySectionCollapseController, StudioViewMode } from "../studioViewState";

export default function LessonStudioWorkspaceToolbar({ viewMode, onViewModeChange, sectionController }: { viewMode: StudioViewMode; onViewModeChange: (mode: StudioViewMode) => void; sectionController: ActivitySectionCollapseController | null }) {
  const unavailable = !sectionController?.canCollapse;
  const explanation = sectionController?.disabledReason ?? "This activity editor has no collapsible sections.";
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Lesson Studio workspace controls">
    <div role="group" aria-label="Activity editor layout" className="flex rounded-lg border border-slate-300 p-1">
      <button type="button" aria-pressed={viewMode === "editor"} onClick={() => onViewModeChange("editor")} className={`min-h-10 rounded-md px-3 text-xs font-semibold ${viewMode === "editor" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Editor only</button>
      <button type="button" aria-pressed={viewMode === "split"} onClick={() => onViewModeChange("split")} className={`min-h-10 rounded-md px-3 text-xs font-semibold ${viewMode === "split" ? "bg-slate-900 text-white" : "text-slate-600"}`}>Split preview</button>
    </div>
    <div className="flex gap-2" title={unavailable ? explanation : undefined}>
      <button type="button" disabled={unavailable} aria-label={`Collapse all sections${unavailable ? `. ${explanation}` : ""}`} onClick={() => sectionController?.collapseAll()} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">Collapse All</button>
      <button type="button" disabled={unavailable} aria-label={`Expand all sections${unavailable ? `. ${explanation}` : ""}`} onClick={() => sectionController?.expandAll()} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">Expand All</button>
    </div>
  </div>;
}
