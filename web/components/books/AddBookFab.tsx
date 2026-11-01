"use client";

import { Modal } from "@/components/ui/Modal";
import { AddBookForm } from "./AddBookForm";

// No longer renders its own FAB trigger — the bottom nav's "+" button
// (components/nav/BottomNav.tsx) opens this now, see
// web/REDESIGN_SPEC.md section 4.3. `open`/`onClose` are owned by the
// parent *ShelvesView, which also owns the ref the nav button passes in
// as `returnFocusRef`, so closing still returns focus to the button that
// opened it.
export function AddBookFab({
  activeGenre,
  open,
  onClose,
  returnFocusRef,
}: {
  activeGenre?: string;
  open: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Add a book" returnFocusRef={returnFocusRef}>
      <h2 className="sheet-title">Add a book</h2>
      <AddBookForm initialGenre={activeGenre} onSuccess={onClose} />
    </Modal>
  );
}
