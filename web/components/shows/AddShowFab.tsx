"use client";

import { Modal } from "@/components/ui/Modal";
import { AddShowForm } from "./AddShowForm";

// Mirrors AddBookFab.tsx — see its comment. No longer renders its own FAB
// trigger; the bottom nav's "+" button opens this, controlled by the
// parent ShowsShelvesView.
export function AddShowFab({
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
    <Modal open={open} onClose={onClose} title="Add a show" returnFocusRef={returnFocusRef}>
      <AddShowForm initialGenre={activeGenre} onSuccess={onClose} />
    </Modal>
  );
}
