"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { deleteItem, restoreItem } from "@/lib/actions/listItems";
import type { ListItemRow } from "@/types/database";

const TOAST_MS = 5000;

type DeleteContextValue = {
  hiddenIds: Set<string>;
  requestDelete: (item: ListItemRow) => void;
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
  const [toast, setToast] = useState<{ row: ListItemRow; visible: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Map<string, Promise<unknown>>>(new Map());

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clearTimer, []);

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
    clearTimer();
    setToast({ row, visible: true });
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const undo = useCallback(async () => {
    if (!toast) return;
    const { row } = toast;
    clearTimer();
    setToast(null);
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
  }, [toast]);

  const value = useMemo(() => ({ hiddenIds, requestDelete }), [hiddenIds, requestDelete]);

  return (
    <DeleteContext.Provider value={value}>
      {children}
      {toast && (
        <div className="undo-toast show" role="status">
          <span>Removed &ldquo;{toast.row.title}&rdquo;</span>
          <button type="button" className="undo-btn" onClick={undo}>
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
