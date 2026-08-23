"use client";

import { useState, useTransition } from "react";
import { toggleRead, setRating } from "@/lib/actions/listItems";
import { kindLabel } from "@/lib/books/kindLabel";
import type { ListItemRow } from "@/types/database";

// Direct port of makeCard()'s interaction model from index.html: tap
// anywhere on the card toggles read/done (clearing rating on unmark),
// thumbs stopPropagation so they don't also toggle the card, clicking an
// already-active thumb clears it. State is applied optimistically and
// fired at the server in the background — same "best effort, don't block
// the UI on the round-trip" feel as the original's localStorage writes.
export function BookCard({ item, color }: { item: ListItemRow; color: string }) {
  const [, startTransition] = useTransition();
  const [done, setDone] = useState(item.status === "done");
  const [rating, setLocalRating] = useState(item.rating);

  function handleToggle() {
    const nowDone = !done;
    setDone(nowDone);
    if (!nowDone) setLocalRating(null);
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
    setLocalRating(next);
    startTransition(() => {
      setRating(item.id, r);
    });
  }

  return (
    <div
      className={`card${done ? " read" : ""}`}
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
