"use client";

import { useCallback, useRef, useState } from "react";
import type { StatusView } from "@/components/ui/StatusToggle";
import type { ListItemRow } from "@/types/database";

const EXIT_ANIMATION_MS = 280;

// Matches ListItemRow["rating"] (which also allows "loved", schema-wide)
// rather than the narrower "liked"|"disliked" the card UI actually
// writes — keeps this hook usable without fighting the wider DB type.
type Rating = ListItemRow["rating"];

// Shared by BooksShelvesView.tsx and ShowsShelvesView.tsx. Owns the
// *authoritative* optimistic done/rating state for every item, rather
// than letting BookCard/ShowCard keep their own local useState for
// either — see the comment on why below.
//
// - `statusOverrides`/`ratingOverrides` are the persistent source of
//   truth used both for filtering (isDone) and for what the card
//   actually renders (getRating) — they don't expire, and they're not
//   optional. Cards read them as controlled props, they never derive
//   done/rating from `item.status`/`item.rating` themselves.
//
//   Why this matters: switching between "On the Shelf" and "Finished"
//   naturally unmounts and remounts cards as they enter/leave the
//   filtered list (React matches by `key`, but an item that's fully
//   excluded from the rendered array for a moment loses its component
//   instance). A card that re-derived `done`/`rating` from its raw
//   `item` prop on remount would silently fall back to whatever the last
//   server-confirmed value was — which, if the Server Action's
//   revalidatePath round-trip hasn't landed yet, is stale. Controlled
//   props sourced from this hook sidestep that entirely: the override
//   persists across mount/unmount, so a remounted card immediately shows
//   the correct optimistic state regardless of server timing.
//
// - `animatingOut` is *purely* a fixed-duration visual flag for the CSS
//   fade (see .card.exiting in globals.css) and has no bearing on
//   whether an item is actually included in the filtered list.
export function useStatusTransitions(statusView: StatusView) {
  const [statusOverrides, setStatusOverrides] = useState<Map<string, boolean>>(new Map());
  const [ratingOverrides, setRatingOverrides] = useState<Map<string, Rating>>(new Map());
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const isDone = useCallback(
    (item: { id: string; status: string }) =>
      statusOverrides.has(item.id) ? statusOverrides.get(item.id)! : item.status === "done",
    [statusOverrides]
  );

  const getRating = useCallback(
    (item: { id: string; rating: Rating }) =>
      ratingOverrides.has(item.id) ? ratingOverrides.get(item.id)! : item.rating,
    [ratingOverrides]
  );

  const handleRatingChange = useCallback((itemId: string, rating: Rating) => {
    setRatingOverrides((prev) => new Map(prev).set(itemId, rating));
  }, []);

  const handleStatusChange = useCallback(
    (itemId: string, nowDone: boolean) => {
      setStatusOverrides((prev) => new Map(prev).set(itemId, nowDone));
      if (!nowDone) handleRatingChange(itemId, null); // unmarking clears the rating, same as before

      const leavingActiveView =
        (statusView === "shelf" && nowDone) || (statusView === "finished" && !nowDone);
      if (!leavingActiveView) return;

      setAnimatingOut((prev) => new Set(prev).add(itemId));
      const existingTimer = timers.current.get(itemId);
      if (existingTimer) clearTimeout(existingTimer);
      timers.current.set(
        itemId,
        setTimeout(() => {
          setAnimatingOut((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
          timers.current.delete(itemId);
        }, EXIT_ANIMATION_MS)
      );
    },
    [statusView, handleRatingChange]
  );

  return { isDone, getRating, animatingOut, handleStatusChange, handleRatingChange };
}
