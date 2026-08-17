import { useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildCommandRegistry, commandHistoryKey, getPaletteKeyAction, getPointerSelection, matchCommands, moveActiveIndex, parseCommandHistory, recordCommandHistory, type CommandResult } from "../../../domain/command-palette";
import { canViewMediaLibrary } from "../../../domain/media";
import { useAdminPermissions } from "../permissions/useAdminPermissions";
import { Alert, Badge, Dialog } from "../ui";
import { commandPalettePanelClassName, splitCommandMatch } from "./commandPalettePresentation";

type Props = { open: boolean; pathname: string; search: string; onClose: () => void };

function loadHistory() {
  try { return parseCommandHistory(window.localStorage.getItem(commandHistoryKey)); }
  catch { return []; }
}

export default function CommandPalette({ open, pathname, search, onClose }: Props) {
  const permissions = useAdminPermissions();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState(loadHistory);
  const [message, setMessage] = useState<string | null>(null);
  const commands = useMemo(() => buildCommandRegistry({ pathname, search, canEditDrafts: permissions.canEditDrafts, canPublish: permissions.canPublish, canViewMediaLibrary: canViewMediaLibrary(permissions) }), [pathname, permissions, search]);
  const results = useMemo(() => matchCommands(commands, query, history), [commands, history, query]);
  const resolvedActiveIndex = results.length === 0 ? -1 : Math.min(Math.max(activeIndex, 0), results.length - 1);
  const active = results[resolvedActiveIndex] ?? null;

  function remember(id: string) {
    const next = recordCommandHistory(history, id); setHistory(next);
    try { window.localStorage.setItem(commandHistoryKey, JSON.stringify(next)); } catch { /* history remains session-local */ }
  }
  function select(result: CommandResult) {
    if (!result.available || !result.href) { setMessage(result.unavailableReason ?? "This command is unavailable."); return; }
    remember(result.id); onClose(); navigate(result.href);
    const eventName = result.eventName;
    if (eventName) window.requestAnimationFrame(() => window.dispatchEvent(new Event(eventName)));
  }

  return <Dialog isOpen={open} onClose={onClose} title="Command Palette" description="Search navigation, content, templates, and authoring commands." initialFocusRef={inputRef} className={commandPalettePanelClassName}>
    <label className="sr-only" htmlFor={`${listId}-search`}>Search commands</label>
    <input ref={inputRef} id={`${listId}-search`} role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list" aria-activedescendant={active ? `${listId}-${active.id}` : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setMessage(null); }} onKeyDown={(event) => { const action = getPaletteKeyAction(event.key); if (action === "next" || action === "previous") { event.preventDefault(); setActiveIndex((current) => moveActiveIndex(current, action === "next" ? 1 : -1, results.length)); } else if (action === "select" && active) { event.preventDefault(); select(active); } }} placeholder="Search commands…" className="admin-focus min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base" />
    {message && <div className="mt-4"><Alert tone="warning">{message}</Alert></div>}
    <div id={listId} role="listbox" aria-label="Command results" className="mt-4 max-h-[min(60dvh,32rem)] overflow-y-auto rounded-xl border border-slate-200">
      {results.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No matching commands.</p> : results.map((result, index) => {
        const parts = splitCommandMatch(result.title, result.matchStart, result.matchLength);
        return <button key={result.id} id={`${listId}-${result.id}`} role="option" aria-selected={index === resolvedActiveIndex} type="button" onMouseEnter={() => setActiveIndex(getPointerSelection(index, results.length))} onClick={() => select(result)} className={`admin-focus flex min-h-14 w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left last:border-0 ${index === resolvedActiveIndex ? "bg-blue-50" : "hover:bg-slate-50"}`}>
          <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-950">{parts.before}{parts.match && <mark className="rounded bg-amber-100 text-inherit">{parts.match}</mark>}{parts.after}</span><span className="mt-1 block truncate text-xs text-slate-500">{result.category}{result.subtitle ? ` · ${result.subtitle}` : ""}</span></span>
          {!result.available && <Badge tone="neutral">Unavailable</Badge>}
        </button>;
      })}
    </div>
    <p className="mt-3 text-xs text-slate-500">Use ↑ and ↓ to select, Enter to open, and Esc to close.</p>
  </Dialog>;
}
