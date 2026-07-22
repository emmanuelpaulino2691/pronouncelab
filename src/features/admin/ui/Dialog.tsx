import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "./Button";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      focusableSelector
    )
  ).filter(
    (element) =>
      element.getAttribute("aria-hidden") !== "true"
  );
}

export type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  preventClose?: boolean;
  className?: string;
};

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocusRef,
  preventClose = false,
  className = "",
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const preventCloseRef = useRef(preventClose);

  useEffect(() => {
    onCloseRef.current = onClose;
    preventCloseRef.current = preventClose;
  }, [onClose, preventClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;
    const target =
      initialFocusRef?.current ??
      (dialog
        ? getFocusableElements(dialog)[0]
        : null) ??
      dialog;

    target?.focus({ preventScroll: true });

    return () => {
      if (
        previouslyFocused?.isConnected
      ) {
        previouslyFocused.focus({
          preventScroll: true,
        });
      }
    };
  }, [initialFocusRef, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow =
      document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        if (!preventCloseRef.current) {
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const focusable =
        getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (!dialog.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (
        event.shiftKey &&
        activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );
    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function requestClose() {
    if (!preventClose) onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-slate-950/60 p-2 sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
      role="presentation"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-busy={preventClose || undefined}
        aria-labelledby={titleId}
        aria-describedby={
          description ? descriptionId : undefined
        }
        tabIndex={-1}
        className={`grid max-h-[calc(100dvh-1rem)] w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] ${className}`}
      >
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-xl font-bold text-slate-950 sm:text-2xl"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-2 text-sm leading-6 text-slate-600"
              >
                {description}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            icon="close"
            aria-label={`Close ${title}`}
            disabled={preventClose}
            onClick={requestClose}
            className="min-h-11 min-w-11 shrink-0 px-3"
          >
            <span className="sr-only">Close</span>
          </Button>
        </header>

        <div className="min-w-0 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer && (
          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            {footer}
          </footer>
        )}
      </section>
    </div>,
    document.body
  );
}
