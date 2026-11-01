"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { deleteItem, restoreItem } from "@/lib/actions/listItems";
import type { ListItemRow } from "@/types/database";

const TOAST_MS = 5000;

type DeleteContextValue = {
  hiddenIds: Set<string>;
  requestDelete: (item: ListItemRow) => void;
  // Generic "message + Undo" toast, also used by the mark-read/watched undo
  // (lib/hooks/useStatusTransitions.ts).
  showUndoToast: (message: string, onUndo: () => void, ms?: number) => void;
};

const DeleteContext = createContext<DeleteContextValue | null>(null);

// Port of the swipe-delete + Undo toast from the static index.html.
//
// The card disappears instantly (its id goes into `hiddenIds`, which the
// shelf views filter on) and the row is deleted on the server straight
// away, so a closed tab can't leave a "deleted" card behind. Undo puts the
// exact same row back via `restoreItem` (same id), then un-hides it.
export function DeleteProvider({ children }: { children: React.ReactNode }) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; onUndo: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Map<string, Promise<unknown>>>(new Map());

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clearTimer, []);

  const showUndoToast = useCallback((message: string, onUndo: () => void, ms = TOAST_MS) => {
    clearTimer();
    setToast({ message, onUndo });
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const requestDelete = useCallback((row: ListItemRow) => {
    setHiddenIds((prev) => new Set(prev).add(row.id));
    const p = deleteItem(row.id).catch(() => {
      // couldn't delete — bring the card back rather than pretend it worked
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      setToast(null);
      alert("Could not remove that right now — please try again.");
    });
    pending.current.set(row.id, p);
    const undoDelete = async () => {
      await pending.current.get(row.id);
      try {
        await restoreItem(row);
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      } catch {
        alert("Could not restore that — please add it again with the + button.");
      }
    };
    showUndoToast(`Removed \u201c${row.title}\u201d`, undoDelete);
  }, [showUndoToast]);

  const value = useMemo(
    () => ({ hiddenIds, requestDelete, showUndoToast }),
    [hiddenIds, requestDelete, showUndoToast]
  );

  return (
    <DeleteContext.Provider value={value}>
      {children}
      {toast && (
        <div className="undo-toast show" role="status">
          <span>{toast.message}</span>
          <button
            type="button"
            className="undo-btn"
            onClick={() => {
              clearTimer();
              setToast(null);
              toast.onUndo();
            }}
          >
            Undo
          </button>
        </div>
      )}
    </DeleteContext.Provider>
  );
}

export function useDelete() {
  const ctx = useContext(DeleteContext);
  if (!ctx) throw new Error("useDelete must be used inside <DeleteProvider>");
  return ctx;
}
