import type { StudentLayoutMode } from "../layouts/studentLayoutMode";
import { studentMenuButtonClass, usesCompactStudentShell } from "../layouts/studentLayoutMode";

type Props = { layoutMode?: StudentLayoutMode; drawerOpen?: boolean; drawerId?: string; onOpenDrawer?: () => void };

export default function Header({ layoutMode = "auto", drawerOpen = false, drawerId, onOpenDrawer }: Props) {
  const compact = usesCompactStudentShell(layoutMode);
  return (
    <header className={`flex min-w-0 items-center justify-between gap-3 border-b bg-white ${layoutMode === "phone" ? "px-3 py-3" : compact ? "px-5 py-4" : "px-4 py-4 sm:px-8 sm:py-5"}`}>
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Open student navigation" aria-expanded={drawerOpen} aria-controls={drawerId} onClick={onOpenDrawer} className={`${studentMenuButtonClass(layoutMode)} min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 text-xl text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}><span aria-hidden="true">☰</span></button>
        {compact ? <span className="truncate text-lg font-bold text-slate-950">PronounceLab</span> : layoutMode === "auto" ? <><span className="truncate text-lg font-bold text-slate-950 lg:hidden">PronounceLab</span><h1 className="hidden min-w-0 truncate text-2xl font-bold text-slate-950 lg:block">Student Dashboard</h1></> : <h1 className="min-w-0 truncate text-2xl font-bold text-slate-950">Student Dashboard</h1>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {!compact && <button className={`${layoutMode === "auto" ? "hidden lg:block" : "block"} min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700`}>Notifications</button>}
        <button type="button" aria-label="Open student profile" className="grid h-11 w-11 place-items-center rounded-full bg-slate-300 font-bold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">EP</button>
      </div>
    </header>
  );
}
