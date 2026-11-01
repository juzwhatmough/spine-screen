"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// How long the exit animation plays before the sheet actually unmounts —
// matches .sheet-panel.closing's animation-duration in globals.css.
const EXIT_MS = 200;

// Portals need `document`, which doesn't exist during SSR. Using
// useSyncExternalStore (rather than a useState+useEffect "mounted" flag)
// avoids the setState-in-effect render cascade this project's stricter
// react-hooks rules flag — there's nothing to subscribe to, this is
// purely "are we past the initial SSR render yet."
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// Bottom sheet (web/REDESIGN_SPEC.md section 7) — portal, focus trap,
// Esc/overlay close, returnFocusRef and the SSR-safe mount check are all
// unchanged from the pre-redesign centred modal this replaces. New here:
// the sheet stays mounted for EXIT_MS after `open` goes false so the
// close transition can play, instead of vanishing instantly.
//
// No title bar: section 7 lists the grabber and the close button as the
// sheet's only chrome, not a heading row — every caller now renders its
// own visible heading inside `children` (see AddBookFab.tsx,
// AddShowFab.tsx, AccountSheet.tsx, DetailSheet.tsx). `title` is used
// only for the dialog's `aria-label`.
export function Modal({
  open,
  onClose,
  title,
  returnFocusRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  // Where focus goes back to on close — pass the triggering button's ref
  // so closing (Esc, overlay click, close button, or a successful
  // submit) always returns focus there rather than wherever the browser
  // defaults to.
  returnFocusRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const [prevOpen, setPrevOpen] = useState(open);
  const [closing, setClosing] = useState(false);

  // Derived-state-from-props, done the way React's docs recommend
  // (comparing against the previous value during render and calling
  // setState conditionally) rather than in a useEffect — this project's
  // stricter react-hooks rules flag a synchronous setState in an effect
  // body, and doing it this way also avoids an extra render's worth of
  // flicker where the sheet would briefly disappear and reappear.
  if (open !== prevOpen) {
    setPrevOpen(open);
    setClosing(!open);
  }

  // The setState here runs inside setTimeout, not synchronously in the
  // effect body, so it's exempt from the same rule.
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setClosing(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  const rendered = open || closing;

  useEffect(() => {
    if (!open) return;

    const content = contentRef.current;
    // Prefer the first real form field over the close button — both are
    // valid focus-trap starting points, but jumping straight to the
    // field is the friendlier default for a form-in-a-sheet.
    const firstField = content?.querySelector<HTMLElement>("input, select, textarea");
    const firstFocusable = content?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstField ?? firstFocusable)?.focus();

    // captured now, not re-read in cleanup — the ref's target could change
    // by the time this effect tears down
    const returnFocusEl = returnFocusRef.current;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !content) return;

      const focusable = Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      returnFocusEl?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!isClient || !rendered) return null;

  return createPortal(
    <div
      className={`sheet-scrim${closing ? " closing" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`sheet-panel${closing ? " closing" : ""}`}
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        <button type="button" className="sheet-close" aria-label="Close" onClick={onClose}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
