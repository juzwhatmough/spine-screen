"use client";

import { useCallback, useRef, useState } from "react";
import type { StatusView } from "@/components/ui/StatusToggle";
import type { ListItemRow } from "@/types/database";

// How long a card stays fully visible and interactive (thumbs clickable)
// after being marked done, before the fade-out even begins. Long enough
// to glance at the card and hit a thumb; not so long it reads as
// "nothing happened." A card that's rated during this window doesn't
// get its timer extended — 1.4s is already generous for a single tap.
const RATE_WINDOW_MS = 1400;
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
// - `animatingOut` is a fixed-duration visual flag for the CSS fade (see
//   .card.exiting in globals.css) and has no bearing on whether an item
//   is actually included in the filtered list — see `leavingView` below.
// - `pendingExit` gates the whole exit sequence behind RATE_WINDOW_MS: an
//   item that just left the active view stays fully interactive (full
//   opacity, thumbs clickable) for that window before `animatingOut` (and
//   therefore the fade + pointer-events:none) even starts. Without this,
//   marking a card done and reaching for the thumbs would be a race
//   against a 280ms fade that starts the instant you tap the card —
//   there'd be no time to rate it. `leavingView(item)` checks *both*
//   flags: an item only actually disappears from the filtered list once
//   pendingExit has cleared, i.e. after the full rate-window + fade.
export function useStatusTransitions(statusView: StatusView) {
  const [statusOverrides, setStatusOverrides] = useState<Map<string, boolean>>(new Map());
  const [ratingOverrides, setRatingOverrides] = useState<Map<string, Rating>>(new Map());
  const [pendingExit, setPendingExit] = useState<Set<string>>(new Set());
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>[]>>(new Map());

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

      const existingTimers = timers.current.get(itemId);
      if (existingTimers) existingTimers.forEach(clearTimeout);
      timers.current.delete(itemId);

      const leavingActiveView =
        (statusView === "shelf" && nowDone) || (statusView === "finished" && !nowDone);
      if (!leavingActiveView) {
        setPendingExit((prev) => {
          if (!prev.has(itemId)) return prev;
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        setAnimatingOut((prev) => {
          if (!prev.has(itemId)) return prev;
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        return;
      }

      setPendingExit((prev) => new Set(prev).add(itemId));
      const rateWindowTimer = setTimeout(() => {
        setAnimatingOut((prev) => new Set(prev).add(itemId));
        const fadeTimer = setTimeout(() => {
          setPendingExit((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
          setAnimatingOut((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
          timers.current.delete(itemId);
        }, EXIT_ANIMATION_MS);
        timers.current.set(itemId, [fadeTimer]);
      }, RATE_WINDOW_MS);
      timers.current.set(itemId, [rateWindowTimer]);
    },
    [statusView, handleRatingChange]
  );

  // An item stays in the rendered/filtered list as long as it either
  // matches the active view outright, or is still within its
  // rate-window-then-fade grace period.
  const leavingView = useCallback((itemId: string) => pendingExit.has(itemId), [pendingExit]);

  return { isDone, getRating, leavingView, animatingOut, handleStatusChange, handleRatingChange };
}
