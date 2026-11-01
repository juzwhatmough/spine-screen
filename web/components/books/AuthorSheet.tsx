"use client";

import { Modal } from "@/components/ui/Modal";

// Books' "Author ▾" filter chip opens this (web/REDESIGN_SPEC.md section
// 5.4). Counts come from the caller's `authorOptions` derivation, same
// as the dropped FilterBar's Author dropdown used.
export function AuthorSheet({
  open,
  onClose,
  returnFocusRef,
  authors,
  selected,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
  authors: { name: string; count: number }[];
  selected: string;
  onSelect: (author: string) => void;
}) {
  function pick(author: string) {
    onSelect(author);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Filter by author" returnFocusRef={returnFocusRef}>
      <h2 className="sheet-title">Filter by author</h2>
      <div role="radiogroup" aria-label="Filter by author">
        <button
          type="button"
          role="radio"
          aria-checked={selected === ""}
          className="author-sheet-row"
          onClick={() => pick("")}
        >
          <span>All authors</span>
          <span className={`author-sheet-radio${selected === "" ? " on" : ""}`} aria-hidden="true">
            {selected === "" && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5 9-10" />
              </svg>
            )}
          </span>
        </button>
        {authors.map((a) => (
          <button
            key={a.name}
            type="button"
            role="radio"
            aria-checked={selected === a.name}
            className="author-sheet-row"
            onClick={() => pick(a.name)}
          >
            <span>
              {a.name}
              <span className="author-sheet-count">{a.count}</span>
            </span>
            <span className={`author-sheet-radio${selected === a.name ? " on" : ""}`} aria-hidden="true">
              {selected === a.name && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              )}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
