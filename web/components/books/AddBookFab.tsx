"use client";

import { useRef, useState } from "react";
import { Fab } from "@/components/ui/Fab";
import { Modal } from "@/components/ui/Modal";
import { AddBookForm } from "./AddBookForm";

export function AddBookFab({ activeGenre }: { activeGenre?: string }) {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Fab ref={fabRef} label="Add a book" onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add a book" returnFocusRef={fabRef}>
        <AddBookForm initialGenre={activeGenre} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
