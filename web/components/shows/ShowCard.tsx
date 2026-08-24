"use client";

import { useTransition } from "react";
import { toggleRead, setRating } from "@/lib/actions/listItems";
import type { ListItemRow } from "@/types/database";

// Same interaction model as BookCard (shared toggleRead/setRating actions
// work on any list_items row regardless of media_type) but with the field
// mapping DESIGN_SPEC.md documents for Shows: `creator` holds the
// streaming platform and renders in the `.kind` badge instead of an
// author line; a warning badge replaces the hook when the title isn't
// currently streaming.
//
// `watched`/`rating` are CONTROLLED props (from useStatusTransitions in
// the parent view) — see BookCard.tsx for why this isn't local state.
export function ShowCard({
  item,
  color,
  watched,
  rating,
  exiting = false,
  onStatusChange,
  onRatingChange,
}: {
  item: ListItemRow;
  color: string;
  watched: boolean;
  rating: ListItemRow["rating"];
  exiting?: boolean;
  onStatusChange: (itemId: string, nowWatched: boolean) => void;
  onRatingChange: (itemId: string, rating: ListItemRow["rating"]) => void;
}) {
  const [, startTransition] = useTransition();

  function handleToggle() {
    const nowWatched = !watched;
    onStatusChange(item.id, nowWatched);
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

  const currentlyStreaming = item.meta?.currentlyStreaming !== false;

  return (
    <div
      className={`card${watched ? " read" : ""}${exiting ? " exiting" : ""}`}
      style={{ "--tagcolor": color } as React.CSSProperties}
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <div className="kind">{item.creator ?? "Unknown platform"}</div>
      <p className="title">{item.title}</p>
      <p className="hook">{item.meta?.hook ?? ""}</p>
      {item.meta?.unconfirmed ? (
        <p className="warn-badge">⚠ Unconfirmed — verify streaming availability</p>
      ) : (
        !currentlyStreaming && (
          <p className="warn-badge">
            ⚠ Not currently streaming — {item.meta?.note || "rent/buy only"}
          </p>
        )
      )}
      <div className="foot">
        <span className="status">{watched ? "Watched" : "To watch"}</span>
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
          <span className="stamp">{watched ? "Watched ✓" : "Mark watched"}</span>
        </div>
      </div>
    </div>
  );
}
