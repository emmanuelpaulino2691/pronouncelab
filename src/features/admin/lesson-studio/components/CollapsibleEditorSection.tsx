import type { ReactNode } from "react";

export default function CollapsibleEditorSection({ sectionId, title, collapsed, summary, warning, onToggle, children, className = "" }: { sectionId: string; title: string; collapsed: boolean; summary: string; warning?: string | null; onToggle: () => void; children: ReactNode; className?: string }) {
  const contentId = `studio-section-${sectionId}`;
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h2 className="font-semibold text-slate-950">{title}</h2>{collapsed && <p className="mt-1 break-words text-sm text-slate-600">{summary}</p>}{collapsed && warning && <p className="mt-1 text-sm text-amber-700">{warning}</p>}</div>
      <button type="button" aria-expanded={!collapsed} aria-controls={contentId} aria-label={`${collapsed ? "Expand" : "Collapse"} ${title} section`} onClick={onToggle} className="min-h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold">{collapsed ? "Expand section" : "Collapse section"}</button>
    </div>
    <div id={contentId} hidden={collapsed} className="mt-5">{children}</div>
  </section>;
}
