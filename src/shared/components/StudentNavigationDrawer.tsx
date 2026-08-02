import { useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import { drawerKeyboardAction, shouldWrapDrawerFocus } from "./drawerKeyboard";

const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

type Props = { open: boolean; id: string; onClose: () => void };

export default function StudentNavigationDrawer({ open, id, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(focusableSelector)?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      const action = drawerKeyboardAction(event.key);
      if (action === "close") { event.preventDefault(); onCloseRef.current(); return; }
      if (action !== "trap-focus" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
      if (shouldWrapDrawerFocus(event.shiftKey, activeIndex, focusable.length - 1)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); previouslyFocused?.focus({ preventScroll: true }); };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={panelRef} id={id} role="dialog" aria-modal="true" aria-label="Student navigation" className="h-full w-[min(20rem,85vw)] overflow-y-auto bg-slate-900 shadow-2xl">
        <div className="flex justify-end p-3"><button type="button" aria-label="Close student navigation" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-2xl text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">×</button></div>
        <Sidebar className="w-full pt-0" onNavigate={onClose} />
      </div>
    </div>
  );
}
