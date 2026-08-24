"use client";

import { useState, useTransition } from "react";
import { toggleRead, setRating, updateShowPlatform } from "@/lib/actions/listItems";
import { formatRelativeTime, isStale } from "@/lib/shows/relativeTime";
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
// Platform/verified-at editing is *not* lifted the same way — editing is
// a deliberate, momentary action rather than something that races a
// status-view-driven remount, so plain local optimistic state here is a
// reasonable simplification (flagged in the PR, not a silent shortcut).
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
  const [, startSaveTransition] = useTransition();

  const [platform, setPlatform] = useState(item.creator ?? "Unknown platform");
  const [verifiedAt, setVerifiedAt] = useState(item.meta?.platformVerifiedAt ?? null);
  const [unconfirmed, setUnconfirmed] = useState(!!item.meta?.unconfirmed);
  const [editing, setEditing] = useState(false);
  const [draftPlatform, setDraftPlatform] = useState(platform);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  function startEditing(e: React.MouseEvent) {
    e.stopPropagation();
    setDraftPlatform(platform === "Unknown platform" ? "" : platform);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setSaveError(null);
  }

  function savePlatform() {
    const trimmed = draftPlatform.trim();
    if (!trimmed) {
      setSaveError("Platform is required");
      return;
    }
    // Optimistic — same manual-only philosophy as the rest of Shows data
    // entry: this is the user's own correction, not a re-guess, so there's
    // nothing to reconcile against.
    const now = new Date().toISOString();
    setPlatform(trimmed);
    setVerifiedAt(now);
    setUnconfirmed(false);
    setEditing(false);
    setSaveError(null);
    startSaveTransition(async () => {
      try {
        await updateShowPlatform(item.id, trimmed);
      } catch {
        alert("Could not save that platform right now — please try again.");
      }
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
      <div className="kind">
        {editing ? (
          <span className="kind-edit" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={draftPlatform}
              autoFocus
              onChange={(e) => setDraftPlatform(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") savePlatform();
                if (e.key === "Escape") cancelEditing();
              }}
            />
            <button type="button" aria-label="Save platform" onClick={savePlatform}>
              ✓
            </button>
            <button type="button" aria-label="Cancel" onClick={cancelEditing}>
              ✕
            </button>
          </span>
        ) : (
          <>
            {platform}
            <button
              type="button"
              className="kind-edit-btn"
              aria-label="Edit platform"
              title="Edit platform"
              onClick={startEditing}
            >
              ✎
            </button>
          </>
        )}
      </div>
      {editing && saveError && (
        <p className="form-error" style={{ margin: "-4px 0 8px", fontSize: 11 }}>
          {saveError}
        </p>
      )}
      {verifiedAt && !editing && (
        <p className={`verified-note${isStale(verifiedAt) ? " stale" : ""}`}>
          {formatRelativeTime(verifiedAt)}
        </p>
      )}
      <p className="title">{item.title}</p>
      <p className="hook">{item.meta?.hook ?? ""}</p>
      {unconfirmed ? (
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
