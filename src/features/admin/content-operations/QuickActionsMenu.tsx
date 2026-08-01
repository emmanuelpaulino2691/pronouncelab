import { useEffect, useRef, useState } from "react";

export type QuickAction = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  explanation?: string;
  danger?: boolean;
};

export function QuickActionsMenu({ label, actions }: { label: string; actions: QuickAction[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not(:disabled)") ?? []);
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const offset = event.key === "ArrowDown" ? 1 : -1;
    items[(current + offset + items.length) % items.length]?.focus();
  }

  return <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
    <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (!open && event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }} className="admin-focus min-h-11 min-w-11 rounded-lg border border-slate-300 px-3 text-xl font-bold text-slate-700 hover:bg-slate-50">&#8942;</button>
    {open && <div role="menu" aria-label={label} className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      {actions.map((action) => <button key={action.label} role="menuitem" type="button" disabled={action.disabled} title={action.explanation} onClick={() => { setOpen(false); action.onSelect(); }} className={`admin-focus flex w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${action.danger ? "text-red-700 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:text-slate-400`}>
        <span>{action.label}</span>{action.disabled && action.explanation && <span className="sr-only">. {action.explanation}</span>}
      </button>)}
    </div>}
  </div>;
}
