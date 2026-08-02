import type { StudentLayoutMode } from "../layouts/studentLayoutMode";
import { studentMenuButtonClass } from "../layouts/studentLayoutMode";

type Props = { layoutMode?: StudentLayoutMode; drawerOpen?: boolean; drawerId?: string; onOpenDrawer?: () => void };

export default function Header({ layoutMode = "auto", drawerOpen = false, drawerId, onOpenDrawer }: Props) {
  return (
    <header className={`flex min-w-0 items-center justify-between gap-3 border-b bg-white ${layoutMode === "phone" ? "px-3 py-3" : layoutMode === "tablet" ? "px-5 py-4" : "px-4 py-4 sm:px-8 sm:py-5"}`}>
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Open student navigation" aria-expanded={drawerOpen} aria-controls={drawerId} onClick={onOpenDrawer} className={`${studentMenuButtonClass(layoutMode)} min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 text-xl text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}><span aria-hidden="true">☰</span></button>
        <span className={`${layoutMode === "phone" ? "text-lg" : "text-xl"} truncate font-bold text-slate-950`}>PronounceLab</span>
      </div>
      <button type="button" aria-label="Open student profile" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg></button>
    </header>
  );
}
