"use client";

import { useRef, useState } from "react";
import { Fab } from "@/components/ui/Fab";
import { Modal } from "@/components/ui/Modal";
import { AddShowForm } from "./AddShowForm";

export function AddShowFab({ activeGenre }: { activeGenre?: string }) {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Fab ref={fabRef} label="Add a show" onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add a show" returnFocusRef={fabRef}>
        <AddShowForm initialGenre={activeGenre} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
