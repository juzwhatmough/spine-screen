"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { coverColor } from "@/lib/ui/coverColor";
import { kindLabel } from "@/lib/books/kindLabel";
import { formatRelativeTime, isStale } from "@/lib/shows/relativeTime";
import { toggleRead, setRating, updateShowPlatform } from "@/lib/actions/listItems";
import type { ListItemRow } from "@/types/database";

type Rating = ListItemRow["rating"];

// Detail sheet (web/REDESIGN_SPEC.md section 8.1) — one shared component
// for Books and Shows, opened from the cover button's tap (see
// BookCard.tsx/ShowCard.tsx). Rendered once at the *ShelvesView level,
// keyed by item id, rather than nested inside the card: marking an item
// done can eventually remove its card from the active On the
// Shelf/Finished view (after the rate window), and a sheet nested inside
// that card would unmount with it mid-interaction. Living at the parent
// level means it survives that.
//
// `done`/`rating` are the same controlled values from useStatusTransitions
// that the card reads — never derived from `item.status`/`item.rating`
// here either, so the sheet and the card underneath never disagree.
//
// Shows' platform editing moves here from the card (this is what section
// 8.1 calls "moved here from the card") — BookCard.tsx/ShowCard.tsx's
// PR2 comment flagged the card's interim edit row as temporary pending
// this sheet; it's removed from the card in this same PR.
export function DetailSheet({
  item,
  kind,
  open,
  onClose,
  returnFocusRef,
  done,
  rating,
  onStatusChange,
  onRatingChange,
}: {
  item: ListItemRow;
  kind: "book" | "show";
  open: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
  done: boolean;
  rating: Rating;
  onStatusChange: (itemId: string, nowDone: boolean, title?: string) => void;
  onRatingChange: (itemId: string, rating: Rating) => void;
}) {
  const [, startTransition] = useTransition();
  const [, startSaveTransition] = useTransition();
  const color = coverColor(item.id);
  const verb = kind === "book" ? "read" : "watched";

  // Shows-only platform editing state — see the file comment above. Keyed
  // by item id at the call site (ShowsShelvesView), so this resets
  // cleanly whenever the sheet is reopened for a different item.
  const [platform, setPlatform] = useState(item.creator ?? "Unknown platform");
  const [verifiedAt, setVerifiedAt] = useState(item.meta?.platformVerifiedAt ?? null);
  const [unconfirmed, setUnconfirmed] = useState(!!item.meta?.unconfirmed);
  const [editing, setEditing] = useState(false);
  const [draftPlatform, setDraftPlatform] = useState(platform);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  function handleToggleDone() {
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

  const currentlyStreaming = item.meta?.currentlyStreaming !== false;
  const tagLabel = kind === "book" ? kindLabel(item.meta?.source_status) : unconfirmed ? "UNCONFIRMED" : "VERIFIED";
  const tagGold = kind === "book" ? tagLabel === "From your list" : !unconfirmed;

  return (
    <Modal open={open} onClose={onClose} title={item.title} returnFocusRef={returnFocusRef}>
      <div className="detail-top">
        <div
          className="detail-thumb"
          style={{ background: color.bg, color: color.fg }}
          aria-hidden="true"
        >
          <span className="detail-thumb-title">{item.title}</span>
          {done && (
            <>
              <span className="mq-cover-dim" aria-hidden="true" />
              <span className="mq-stamp detail-thumb-stamp" aria-hidden="true">
                {kind === "book" ? "READ" : "WATCHED"}
              </span>
            </>
          )}
        </div>
        <div className="detail-top-info">
          <span className="detail-tag-pill" style={{ color: tagGold ? "var(--mq-gold)" : "var(--mq-text)" }}>
            {tagLabel}
          </span>
          <h2 className="detail-title">{item.title}</h2>
          {kind === "book" ? (
            item.creator && <p className="detail-creator">{item.creator}</p>
          ) : (
            <div className="detail-creator">
              {editing ? (
                <span className="mq-platform-row">
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
                </span>
              ) : (
                <>
                  <span>{platform}</span>
                  <button
                    type="button"
                    className="detail-edit-btn"
                    aria-label="Edit platform"
                    title="Edit platform"
                    onClick={startEditing}
                  >
                    ✎
                  </button>
                </>
              )}
            </div>
          )}
          {kind === "show" && editing && saveError && <p className="form-error">{saveError}</p>}
          {kind === "show" && verifiedAt && !editing && (
            <p className={`mq-verified-note${isStale(verifiedAt) ? " stale" : ""}`}>
              {formatRelativeTime(verifiedAt)}
            </p>
          )}
          {item.genre && <span className="detail-genre-pill">{item.genre}</span>}
        </div>
      </div>

      {item.meta?.hook && <p className="detail-hook">{item.meta.hook}</p>}

      {kind === "show" && (unconfirmed || !currentlyStreaming) && (
        <div className="detail-warning" role="note">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          <p>
            {unconfirmed ? (
              <>
                <strong>Unconfirmed.</strong> Verify streaming availability, then edit the platform above.
              </>
            ) : (
              <>
                <strong>Not currently streaming.</strong> {item.meta?.note || "rent/buy only"}
              </>
            )}
          </p>
        </div>
      )}

      <button type="button" className={`detail-primary-btn${done ? " done" : ""}`} onClick={handleToggleDone}>
        {done ? (
          `${kind === "book" ? "Read" : "Watched"} · tap to undo`
        ) : (
          <>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
            {`Mark as ${verb}`}
          </>
        )}
      </button>

      {done && (
        <div className="detail-rate-group">
          <p className="detail-rate-label">How was it? This shapes &quot;Suggest more&quot;.</p>
          <div className="detail-rate-row">
            <button
              type="button"
              className={`detail-rate-btn${rating === "liked" ? " on" : ""}`}
              aria-pressed={rating === "liked"}
              onClick={() => handleRating("liked")}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10v11H4V10zM7 10l4-7a2.5 2.5 0 0 1 3 3l-1 4h6a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.7 21H7" />
              </svg>
              Liked
            </button>
            <button
              type="button"
              className={`detail-rate-btn${rating === "disliked" ? " on" : ""}`}
              aria-pressed={rating === "disliked"}
              onClick={() => handleRating("disliked")}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 14V3h3v11zM17 14l-4 7a2.5 2.5 0 0 1-3-3l1-4H5a2 2 0 0 1-2-2.3l1.3-7A2 2 0 0 1 6.3 3H17" />
              </svg>
              Not for me
            </button>
            <button
              type="button"
              className={`detail-rate-btn love${rating === "loved" ? " on" : ""}`}
              aria-pressed={rating === "loved"}
              onClick={() => handleRating("loved")}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
              </svg>
              Loved
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
