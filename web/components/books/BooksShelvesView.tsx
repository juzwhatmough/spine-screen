"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ShelfNav } from "./ShelfNav";
import { BookShelf } from "./BookShelf";
import { AddBookFab } from "./AddBookFab";
import { AuthorSheet } from "./AuthorSheet";
import { BottomNav } from "@/components/nav/BottomNav";
import { ShelfHeader } from "@/components/nav/ShelfHeader";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { matchesQuery } from "@/lib/search/matchesQuery";
import {
  PendingExitContext,
  useStatusTransitions,
  type StatusView,
} from "@/lib/hooks/useStatusTransitions";
import { useDelete } from "@/lib/hooks/useDeleteWithUndo";
import type { BookShelfData } from "@/lib/books/groupItems";
import type { SourceStatus } from "@/types/database";

const SEARCH_DEBOUNCE_MS = 120;

// Single-select filter chip (section 5.3) alongside the Author sheet —
// maps to item.meta.source_status. "more" deliberately excludes
// "ai-known" even though both render the same kindLabel() text
// ("More by this author") — the spec's own mapping puts ai-known in
// "To explore" instead.
type SourceStatusFilter = "" | "want" | "more" | "explore";
const EXPLORE_STATUSES: SourceStatus[] = ["discover", "ai", "ai-known"];

// Client boundary that owns filter state and does the actual client-side
// AND-filtering — the server page just fetches + groups the data and
// hands it down. BookShelf/AuthorGroup have no server-only imports so
// they're safe to render from here even though they aren't marked
// "use client" themselves.
export function BooksShelvesView({
  shelves,
  userEmail,
  initialView,
}: {
  shelves: BookShelfData[];
  userEmail: string;
  initialView: StatusView;
}) {
  const [statusView, setStatusView] = useState<StatusView>(initialView);
  const [author, setAuthor] = useState("");
  const [sourceStatus, setSourceStatus] = useState<SourceStatusFilter>("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Tracks whichever shelf is currently in view (ShelfNav's scroll-spy),
  // used only to pre-fill the Add-a-book modal's Genre field.
  const [activeGenre, setActiveGenre] = useState<string | undefined>(shelves[0]?.tag);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitialTitle, setAddInitialTitle] = useState<string | undefined>();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [authorSheetOpen, setAuthorSheetOpen] = useState(false);
  const authorChipRef = useRef<HTMLButtonElement>(null);
  // The detail sheet lives here, not inside BookCard — see
  // components/shared/DetailSheet.tsx's file comment for why. Looked up
  // from the full, unfiltered `shelves` prop (not `filtered`) so it keeps
  // showing the right item even if that item has since left the active
  // On the Shelf/Finished view.
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const detailReturnFocusRef = useRef<HTMLButtonElement | null>(null);

  function openDetail(itemId: string, trigger: HTMLButtonElement) {
    detailReturnFocusRef.current = trigger;
    setDetailItemId(itemId);
  }

  const detailItem = useMemo(() => {
    if (!detailItemId) return null;
    for (const shelf of shelves) {
      for (const group of shelf.groups) {
        const found = group.items.find((item) => item.id === detailItemId);
        if (found) return found;
      }
    }
    return null;
  }, [shelves, detailItemId]);

  const {
    isDone,
    getRating,
    leavingView,
    animatingOut,
    pendingExit,
    handleStatusChange,
    handleRatingChange,
  } = useStatusTransitions(statusView, "read");
  const { hiddenIds } = useDelete();

  // statusView lives in the URL (?view=finished) per
  // web/REDESIGN_SPEC.md section 4.3, so the bottom nav's back button
  // works — but it's a shallow `history.pushState`, not a router
  // navigation, so switching views stays client-side with no
  // server round-trip (same philosophy as the filters below).
  function handleStatusViewChange(next: StatusView) {
    setStatusView(next);
    const url = next === "finished" ? `${window.location.pathname}?view=finished` : window.location.pathname;
    window.history.pushState(null, "", url);
  }

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      setStatusView(params.get("view") === "finished" ? "finished" : "shelf");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Search debounce (section 5.5) — the input stays immediately
  // responsive; only the actual filtering (and the empty-state text, so
  // the two never disagree) lags by SEARCH_DEBOUNCE_MS.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const authorCounts = useMemo(() => {
    const counts = new Map<string, number>();
    shelves.forEach((s) =>
      s.groups.forEach((g) => counts.set(g.author, (counts.get(g.author) ?? 0) + g.items.length))
    );
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [shelves]);

  const filtered = useMemo(() => {
    return shelves
      .map((s) => ({
        ...s,
        groups: s.groups
          .filter((g) => !author || g.author === author)
          .map((g) => ({
            ...g,
            items: g.items.filter((item) => {
              if (hiddenIds.has(item.id)) return false;
              if (!matchesQuery(debouncedQuery, item.title, item.creator)) return false;
              const status = item.meta?.source_status;
              if (sourceStatus === "want" && status !== "want") return false;
              if (sourceStatus === "more" && status !== "more") return false;
              if (sourceStatus === "explore" && !EXPLORE_STATUSES.includes(status as SourceStatus)) return false;
              const done = isDone(item);
              const matchesStatus = statusView === "finished" ? done : !done;
              return matchesStatus || leavingView(item.id);
            }),
          }))
          .filter((g) => g.items.length > 0),
      }))
      .filter((s) => s.groups.length > 0);
  }, [shelves, author, sourceStatus, debouncedQuery, statusView, isDone, leavingView, hiddenIds]);

  const filtersActive = !!author || !!sourceStatus;
  const authorLabel = author || "All authors";

  function handleClearFilters() {
    setAuthor("");
    setSourceStatus("");
  }

  function handleAddFromEmptyState(e: React.MouseEvent<HTMLButtonElement>) {
    // So closing the Add sheet returns focus to this button, not the
    // (possibly off-screen) bottom nav Add button addButtonRef usually
    // points at.
    addButtonRef.current = e.currentTarget;
    setAddInitialTitle(debouncedQuery.trim());
    setAddOpen(true);
  }

  const SOURCE_STATUS_CHIPS: { id: SourceStatusFilter; label: string }[] = [
    { id: "", label: "All" },
    { id: "want", label: "Your list" },
    { id: "more", label: "More by author" },
    { id: "explore", label: "To explore" },
  ];

  return (
    <>
      <ShelfHeader
        active="books"
        query={query}
        onQueryChange={setQuery}
        searchLabel="Search books"
        searchPlaceholder="Title or author"
      />

      <div className="mq-chip-row" role="group" aria-label="Filter">
        <button
          type="button"
          ref={authorChipRef}
          aria-haspopup="dialog"
          aria-pressed={!!author}
          className={`mq-chip mq-chip-icon${author ? " on" : ""}`}
          onClick={() => setAuthorSheetOpen(true)}
        >
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </svg>
          {author || "Author"}
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {SOURCE_STATUS_CHIPS.map((chip) => (
          <button
            key={chip.id || "all"}
            type="button"
            aria-pressed={sourceStatus === chip.id}
            className={`mq-chip${sourceStatus === chip.id ? " on" : ""}`}
            onClick={() => setSourceStatus(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <ShelfNav
        shelves={filtered.map((s) => ({ id: s.id, tag: s.tag }))}
        onActiveChange={setActiveGenre}
      />

      <PendingExitContext.Provider value={pendingExit}>
      <main>
        {filtered.length === 0 ? (
          debouncedQuery.trim() ? (
            <EmptyState
              heading="Nothing on this shelf"
              message={`No match for "${debouncedQuery.trim()}". Try another title or author, or add it.`}
              action={
                <button type="button" className="mq-empty-btn" onClick={handleAddFromEmptyState}>
                  {`Add "${debouncedQuery.trim()}"`}
                </button>
              }
            />
          ) : statusView === "finished" ? (
            <EmptyState
              heading="Nothing finished yet"
              message="Mark a card read and it'll show up here."
            />
          ) : filtersActive ? (
            <EmptyState
              heading="Nothing here yet"
              message="Nothing on your shelves matches that combination yet."
              action={
                <button type="button" className="mq-empty-btn" onClick={handleClearFilters}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              heading="Nothing here yet"
              message="Tap the + button to add something new."
            />
          )
        ) : (
          filtered.map((shelf) => (
            <BookShelf
              key={shelf.id}
              shelf={shelf}
              authorLabel={authorLabel}
              animatingOut={animatingOut}
              isDone={isDone}
              getRating={getRating}
              onItemStatusChange={handleStatusChange}
              onItemRatingChange={handleRatingChange}
              onOpenDetail={openDetail}
            />
          ))
        )}
      </main>
      </PendingExitContext.Provider>

      <BottomNav
        statusView={statusView}
        onStatusViewChange={handleStatusViewChange}
        onAddClick={() => {
          setAddInitialTitle(undefined);
          setAddOpen(true);
        }}
        addButtonRef={addButtonRef}
        userEmail={userEmail}
      />
      <AddBookFab
        activeGenre={activeGenre}
        initialTitle={addInitialTitle}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        returnFocusRef={addButtonRef}
      />
      <AuthorSheet
        open={authorSheetOpen}
        onClose={() => setAuthorSheetOpen(false)}
        returnFocusRef={authorChipRef}
        authors={authorCounts}
        selected={author}
        onSelect={setAuthor}
      />
      {detailItem && (
        <DetailSheet
          key={detailItem.id}
          item={detailItem}
          kind="book"
          open={!!detailItemId}
          onClose={() => setDetailItemId(null)}
          returnFocusRef={detailReturnFocusRef}
          done={isDone(detailItem)}
          rating={getRating(detailItem)}
          onStatusChange={handleStatusChange}
          onRatingChange={handleRatingChange}
        />
      )}
    </>
  );
}
