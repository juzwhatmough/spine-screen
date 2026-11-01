"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { AddBookForm } from "@/components/books/AddBookForm";
import { AddShowForm } from "@/components/shows/AddShowForm";

// Single Add sheet (web/REDESIGN_SPEC.md section 8.2), replacing the
// separate AddBookFab/AddShowFab components (both deleted in this PR).
// One entry point (the bottom nav's "+"
// on either tab), with a Book/Show segmented control at the top that
// swaps the form body in place — defaults to whichever tab opened it,
// but can switch while open. Both forms keep their own fields,
// validation, server actions and title type-ahead; this just wraps
// whichever one is currently selected in the shared chrome.
//
// `activeGenre` is this page's own scroll-spy genre (Books' or Shows',
// whichever tab rendered this instance) — it only pre-fills the form
// that matches `defaultKind`. Switching to the other kind falls back to
// that form's own default (its first canonical genre), same as if
// nothing were passed — there's no equivalent "scroll position" for a
// tab the user isn't actually on.
export function AddSheet({
  defaultKind,
  activeGenre,
  initialTitle,
  open,
  onClose,
  returnFocusRef,
}: {
  defaultKind: "book" | "show";
  activeGenre?: string;
  initialTitle?: string;
  open: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}) {
  const [kind, setKind] = useState<"book" | "show">(defaultKind);

  return (
    <Modal open={open} onClose={onClose} title="Add to your shelf" returnFocusRef={returnFocusRef}>
      <h2 className="mq-add-heading">Add to your shelf</h2>
      <div className="mq-segmented mq-add-kind-toggle" role="tablist" aria-label="Book or show">
        <button
          type="button"
          role="tab"
          aria-selected={kind === "book"}
          className={`mq-segmented-item${kind === "book" ? " active" : ""}`}
          onClick={() => setKind("book")}
        >
          Book
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === "show"}
          className={`mq-segmented-item${kind === "show" ? " active" : ""}`}
          onClick={() => setKind("show")}
        >
          Show
        </button>
      </div>
      <div className="mq-add-form">
        {kind === "book" ? (
          <AddBookForm
            initialGenre={kind === defaultKind ? activeGenre : undefined}
            initialTitle={initialTitle}
            onSuccess={onClose}
          />
        ) : (
          <AddShowForm
            initialGenre={kind === defaultKind ? activeGenre : undefined}
            initialTitle={initialTitle}
            onSuccess={onClose}
          />
        )}
      </div>
    </Modal>
  );
}
