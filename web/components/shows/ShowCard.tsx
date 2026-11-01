"use client";

import { useState, useTransition, useContext } from "react";
import { toggleRead, setRating, updateShowPlatform } from "@/lib/actions/listItems";
import { formatRelativeTime, isStale } from "@/lib/shows/relativeTime";
import { coverColor } from "@/lib/ui/coverColor";
import { SwipeDelete } from "@/components/ui/SwipeDelete";
import { useDelete } from "@/lib/hooks/useDeleteWithUndo";
import { PendingExitContext } from "@/lib/hooks/useStatusTransitions";
import type { ListItemRow } from "@/types/database";

// Marquee cover card — see the comment on BookCard.tsx for the shared
// parts (cover as an inert `<button>` until the detail sheet lands,
// sibling quick-mark tick, controlled done/rating, swipe-delete and the
// pending-remove countdown all unchanged).
//
// One deliberate deviation from web/REDESIGN_SPEC.md section 6.1 here:
// the spec's cover tag pill is plain text (platform or "UNCONFIRMED"),
// because section 8.1 moves platform *editing* into the detail sheet —
// but that sheet doesn't exist until a later PR, and the cover is now a
// real `<button>`, so an edit control can no longer live nested inside
// it (buttons can't contain other interactive controls). Rather than
// drop platform editing entirely until the detail sheet ships, it's kept
// here as its own small row below the cover, to be moved into the sheet
// once that PR lands.
export function ShowCard({
  item,
  watched,
  rating,
  exiting = false,
  onStatusChange,
  onRatingChange,
}: {
  item: ListItemRow;
  watched: boolean;
  rating: ListItemRow["rating"];
  exiting?: boolean;
  onStatusChange: (itemId: string, nowWatched: boolean, title?: string) => void;
  onRatingChange: (itemId: string, rating: ListItemRow["rating"]) => void;
}) {
  const [, startTransition] = useTransition();
  const { requestDelete } = useDelete();
  const pending = useContext(PendingExitContext).has(item.id) && !exiting;
  const [, startSaveTransition] = useTransition();
  const color = coverColor(item.id);

  const [platform, setPlatform] = useState(item.creator ?? "Unknown platform");
  const [verifiedAt, setVerifiedAt] = useState(item.meta?.platformVerifiedAt ?? null);
  const [unconfirmed, setUnconfirmed] = useState(!!item.meta?.unconfirmed);
  const [editing, setEditing] = useState(false);
  const [draftPlatform, setDraftPlatform] = useState(platform);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleToggle() {
    const nowWatched = !watched;
    onStatusChange(item.id, nowWatched, item.title);
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

  function startEditing() {
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
  const tagLabel = unconfirmed ? "UNCONFIRMED" : platform.toUpperCase();

  return (
    <SwipeDelete onDelete={() => requestDelete(item)}>
      <div
        className={`card mq-card${exiting ? " exiting" : ""}${pending ? " pending-remove" : ""}`}
      >
        <button
          type="button"
          className="mq-cover mq-cover-show"
          style={{ background: color.bg, color: color.fg }}
          aria-label={`Open details for ${item.title}`}
        >
          <span
            className="mq-cover-tag"
            style={{ color: unconfirmed ? "var(--mq-warn)" : "var(--mq-text)" }}
          >
            {tagLabel}
          </span>
          <span className="mq-cover-title">{item.title}</span>
          {watched && (
            <>
              <span className="mq-cover-dim" aria-hidden="true" />
              <span className="mq-stamp mq-stamp-show" aria-hidden="true">
                WATCHED
              </span>
            </>
          )}
          {!unconfirmed && !currentlyStreaming && (
            <span className="mq-warn-badge-cover" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
            </span>
          )}
          <div className="mark-remove-bar" />
        </button>

        <button
          type="button"
          className={`mq-quickmark${watched ? " on" : ""}`}
          aria-pressed={watched}
          aria-label={watched ? `${item.title}, watched. Tap to undo` : `Mark ${item.title} as watched`}
          onClick={handleToggle}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </button>

        <div className="mq-platform-row">
          {editing ? (
            <>
              <input
                type="text"
                className="mq-platform-input"
                value={draftPlatform}
                autoFocus
                onChange={(e) => setDraftPlatform(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") savePlatform();
                  if (e.key === "Escape") cancelEditing();
                }}
              />
              <button type="button" className="mq-platform-save-btn" aria-label="Save platform" onClick={savePlatform}>
                ✓
              </button>
              <button type="button" className="mq-platform-cancel-btn" aria-label="Cancel" onClick={cancelEditing}>
                ✕
              </button>
            </>
          ) : (
            <>
              <span>{platform}</span>
              <button
                type="button"
                className="mq-platform-edit-btn"
                aria-label="Edit platform"
                title="Edit platform"
                onClick={startEditing}
              >
                ✎
              </button>
              {verifiedAt && (
                <span className={`mq-verified-note${isStale(verifiedAt) ? " stale" : ""}`}>
                  {formatRelativeTime(verifiedAt)}
                </span>
              )}
            </>
          )}
        </div>
        {editing && saveError && <p className="form-error">{saveError}</p>}

        {watched ? (
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
            To watch
          </p>
        )}

        <p className="mark-hint">Rate it — leaving the shelf in a few seconds…</p>
      </div>
    </SwipeDelete>
  );
}
