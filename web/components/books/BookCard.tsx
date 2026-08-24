"use client";

import { useTransition } from "react";
import { toggleRead, setRating } from "@/lib/actions/listItems";
import { kindLabel } from "@/lib/books/kindLabel";
import type { ListItemRow } from "@/types/database";

// Direct port of makeCard()'s interaction model from index.html: tap
// anywhere on the card toggles read/done (clearing rating on unmark),
// thumbs stopPropagation so they don't also toggle the card, clicking an
// already-active thumb clears it.
//
// `done`/`rating` are CONTROLLED props (from useStatusTransitions in the
// parent view), not local state — a card that derived them from
// `item.status`/`item.rating` itself would show stale values whenever it
// remounts (which happens naturally when switching the On the
// Shelf/Finished status view moves it in or out of the filtered list)
// and the server hasn't confirmed the latest change yet. See
// lib/hooks/useStatusTransitions.ts for the full reasoning.
export function BookCard({
  item,
  color,
  done,
  rating,
  exiting = false,
  onStatusChange,
  onRatingChange,
}: {
  item: ListItemRow;
  color: string;
  done: boolean;
  rating: ListItemRow["rating"];
  // True for a brief window right after this card's status change makes
  // it no longer belong in the active On the Shelf/Finished view — purely
  // a CSS hook (.card.exiting), no bearing on the actual filtering.
  exiting?: boolean;
  onStatusChange: (itemId: string, nowDone: boolean) => void;
  onRatingChange: (itemId: string, rating: ListItemRow["rating"]) => void;
}) {
  const [, startTransition] = useTransition();

  function handleToggle() {
    const nowDone = !done;
    onStatusChange(item.id, nowDone);
    startTransition(() => {
      toggleRead(item.id);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  }

  function handleRating(r: "liked" | "disliked", e: React.MouseEvent) {
    e.stopPropagation();
    const next = rating === r ? null : r;
    onRatingChange(item.id, next);
    startTransition(() => {
      setRating(item.id, r);
    });
  }

  return (
    <div
      className={`card${done ? " read" : ""}${exiting ? " exiting" : ""}`}
      style={{ "--tagcolor": color } as React.CSSProperties}
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <div className="kind">{kindLabel(item.meta?.source_status)}</div>
      <p className="title">{item.title}</p>
      {item.creator && <p className="author">{item.creator}</p>}
      <p className="hook">{item.meta?.hook ?? ""}</p>
      <div className="foot">
        <span className="status">{done ? "Read" : "To read"}</span>
        <div className="right-controls">
          <div className="thumbs">
            <button
              type="button"
              className={`thumb-btn up${rating === "liked" ? " active" : ""}`}
              title="I liked this"
              aria-label="Thumbs up"
              onClick={(e) => handleRating("liked", e)}
            >
              👍
            </button>
            <button
              type="button"
              className={`thumb-btn down${rating === "disliked" ? " active" : ""}`}
              title="Not for me"
              aria-label="Thumbs down"
              onClick={(e) => handleRating("disliked", e)}
            >
              👎
            </button>
          </div>
          <span className="stamp">{done ? "Read ✓" : "Mark read"}</span>
        </div>
      </div>
    </div>
  );
}
