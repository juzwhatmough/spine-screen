"use client";

import { useRef, useState } from "react";
import { AccountSheet } from "./AccountSheet";
import type { StatusView } from "@/lib/hooks/useStatusTransitions";

// Floating bottom nav — web/REDESIGN_SPEC.md section 4.3. Replaces the old
// floating FAB (Add) and the in-page StatusToggle (Shelf/Finished). The
// Add button opens components/shared/AddSheet.tsx, controlled by the
// parent *ShelvesView via `onAddClick`/`addButtonRef`.
export function BottomNav({
  statusView,
  onStatusViewChange,
  onAddClick,
  addButtonRef,
  userEmail,
}: {
  statusView: StatusView;
  onStatusViewChange: (view: StatusView) => void;
  onAddClick: () => void;
  addButtonRef: React.RefObject<HTMLButtonElement | null>;
  userEmail: string;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <nav className="bottom-nav" aria-label="Main">
        <button
          type="button"
          className={statusView === "shelf" ? "bottom-nav-item active" : "bottom-nav-item"}
          aria-current={statusView === "shelf" ? "page" : undefined}
          onClick={() => onStatusViewChange("shelf")}
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19V5M9 19V5M14 19l-1-14M19 19l-3.5-13" />
            <path d="M3 19h18" />
          </svg>
          Shelf
        </button>

        <span className="bottom-nav-add-slot">
          <button
            type="button"
            ref={addButtonRef}
            className="bottom-nav-add"
            aria-label="Add a title"
            onClick={onAddClick}
          >
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </span>

        <button
          type="button"
          className={statusView === "finished" ? "bottom-nav-item active" : "bottom-nav-item"}
          aria-current={statusView === "finished" ? "page" : undefined}
          onClick={() => onStatusViewChange("finished")}
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l3 3 5-6" />
          </svg>
          Finished
        </button>

        <button
          type="button"
          ref={accountButtonRef}
          className="bottom-nav-item"
          aria-haspopup="dialog"
          onClick={() => setAccountOpen(true)}
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </svg>
          Account
        </button>
      </nav>

      <AccountSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        returnFocusRef={accountButtonRef}
        email={userEmail}
      />
    </>
  );
}
