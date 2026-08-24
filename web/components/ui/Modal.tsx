"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  // Where focus goes back to on close — pass the FAB button's ref so
  // closing (Esc, overlay click, or a successful submit) always returns
  // focus there rather than wherever the browser defaults to.
  returnFocusRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;

    const content = contentRef.current;
    // Prefer the first real form field over the header's close button —
    // both are valid focus-trap starting points, but jumping straight to
    // the field is the friendlier default for a form-in-a-modal.
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

  if (!isClient || !open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content"
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
