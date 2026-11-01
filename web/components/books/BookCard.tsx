"use client";

import { useContext, useTransition } from "react";
import { toggleRead, setRating } from "@/lib/actions/listItems";
import { kindLabel } from "@/lib/books/kindLabel";
import { coverColor } from "@/lib/ui/coverColor";
import { SwipeDelete } from "@/components/ui/SwipeDelete";
import { useDelete } from "@/lib/hooks/useDeleteWithUndo";
import { PendingExitContext } from "@/lib/hooks/useStatusTransitions";
import type { ListItemRow } from "@/types/database";

// Marquee cover card (web/REDESIGN_SPEC.md section 6). The cover is now a
// `<button>` and tapping it no longer marks the item read — that's a
// sibling "quick-mark" tick (section 6.2), matching the accessibility
// checklist's "the cover and the quick-mark tick are sibling buttons, not
// nested" (section 12). The cover's own click handler opens the detail
// sheet, which doesn't exist until a later PR (section 8.1) — it's
// intentionally inert for now rather than falling back to the old
// tap-to-mark behaviour the spec explicitly says to drop.
//
// `done`/`rating` stay CONTROLLED props from useStatusTransitions (see
// that file for why) — unchanged by this redesign. So does the
// swipe-to-delete wrapper, the pending-remove countdown bar, and the
// rate-window/fade timing (section 6.5 — restyle only, don't regress).
export function BookCard({
  item,
  done,
  rating,
  exiting = false,
  onStatusChange,
  onRatingChange,
}: {
  item: ListItemRow;
  done: boolean;
  rating: ListItemRow["rating"];
  exiting?: boolean;
  onStatusChange: (itemId: string, nowDone: boolean, title?: string) => void;
  onRatingChange: (itemId: string, rating: ListItemRow["rating"]) => void;
}) {
  const [, startTransition] = useTransition();
  const { requestDelete } = useDelete();
  const pending = useContext(PendingExitContext).has(item.id) && !exiting;
  const color = coverColor(item.id);

  function handleToggle() {
    const nowDone = !done;
    onStatusChange(item.id, nowDone, item.title);
    startTransition(() => {
      toggleRead(item.id);
    });
  }

  function handleRating(r: "liked" | "disliked" | "loved") {
    const next = rating === r ? null : r;
    onRatingChange(item.id, next);
    startTransition(() => {
      setRating(item.id, r);
    });
  }

  const tag = kindLabel(item.meta?.source_status);

  return (
    <SwipeDelete onDelete={() => requestDelete(item)}>
      <div
        className={`card mq-card${exiting ? " exiting" : ""}${pending ? " pending-remove" : ""}`}
      >
        <button
          type="button"
          className="mq-cover mq-cover-book"
          style={{ background: color.bg, color: color.fg }}
          aria-label={`Open details for ${item.title}`}
        >
          <span
            className="mq-cover-tag"
            style={{ color: tag === "From your list" ? "var(--mq-gold)" : "var(--mq-text)" }}
          >
            {tag}
          </span>
          <span className="mq-cover-title">{item.title}</span>
          {item.creator && <span className="mq-cover-author">{item.creator.toUpperCase()}</span>}
          {done && (
            <>
              <span className="mq-cover-dim" aria-hidden="true" />
              <span className="mq-stamp mq-stamp-book" aria-hidden="true">
                READ
              </span>
            </>
          )}
          <div className="mark-remove-bar" />
        </button>

        <button
          type="button"
          className={`mq-quickmark${done ? " on" : ""}`}
          aria-pressed={done}
          aria-label={done ? `${item.title}, read. Tap to undo` : `Mark ${item.title} as read`}
          onClick={handleToggle}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </button>

        {done ? (
          <div className="mq-rating-row" role="group" aria-label="Rate it">
            <button
              type="button"
              className={`mq-rate-btn up${rating === "liked" ? " on" : ""}`}
              aria-label="Thumbs up"
              aria-pressed={rating === "liked"}
              onClick={() => handleRating("liked")}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10v11H4V10zM7 10l4-7a2.5 2.5 0 0 1 3 3l-1 4h6a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.7 21H7" />
              </svg>
            </button>
            <button
              type="button"
              className={`mq-rate-btn down${rating === "disliked" ? " on" : ""}`}
              aria-label="Thumbs down"
              aria-pressed={rating === "disliked"}
              onClick={() => handleRating("disliked")}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 14V3h3v11zM17 14l-4 7a2.5 2.5 0 0 1-3-3l1-4H5a2 2 0 0 1-2-2.3l1.3-7A2 2 0 0 1 6.3 3H17" />
              </svg>
            </button>
            <button
              type="button"
              className={`mq-rate-btn love${rating === "loved" ? " on" : ""}`}
              aria-label="Loved it"
              aria-pressed={rating === "loved"}
              onClick={() => handleRating("loved")}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
              </svg>
            </button>
          </div>
        ) : (
          <p className="mq-unread">
            <span className="mq-unread-ring" aria-hidden="true" />
            To read
          </p>
        )}

        <p className="mark-hint">Rate it — leaving the shelf in a few seconds…</p>
      </div>
    </SwipeDelete>
  );
}
