"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ShelfNav } from "@/components/books/ShelfNav";
import { ShowShelf } from "./ShowShelf";
import { BottomNav } from "@/components/nav/BottomNav";
import { ShelfHeader } from "@/components/nav/ShelfHeader";
import { AddSheet } from "@/components/shared/AddSheet";
import { DetailSheet } from "@/components/shared/DetailSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { matchesQuery } from "@/lib/search/matchesQuery";
import {
  PendingExitContext,
  useStatusTransitions,
  type StatusView,
} from "@/lib/hooks/useStatusTransitions";
import { useDelete } from "@/lib/hooks/useDeleteWithUndo";
import type { ShowShelfData } from "@/lib/shows/groupItems";

const SEARCH_DEBOUNCE_MS = 120;

// Single-select across the whole chip row (section 5.3): "All", one chip
// per platform, then "N not streaming" and "N unconfirmed" when N > 0 —
// all mutually exclusive options in the same row, not a separate toggle.
type PlatformFilter = "" | "not-streaming" | "unconfirmed" | string;

// Same pattern as BooksShelvesView.tsx (Genre + Platform instead of
// Genre + Author, no author-group nesting). Platform comes from
// `item.creator` — see types/database.ts's ListItemMeta comment for why
// shows store platform there instead of a dedicated column.
export function ShowsShelvesView({
  shelves,
  userEmail,
  initialView,
}: {
  shelves: ShowShelfData[];
  userEmail: string;
  initialView: StatusView;
}) {
  const [statusView, setStatusView] = useState<StatusView>(initialView);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | undefined>(shelves[0]?.tag);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitialTitle, setAddInitialTitle] = useState<string | undefined>();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  // See the matching comment in BooksShelvesView.tsx.
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const detailReturnFocusRef = useRef<HTMLButtonElement | null>(null);

  function openDetail(itemId: string, trigger: HTMLButtonElement) {
    detailReturnFocusRef.current = trigger;
    setDetailItemId(itemId);
  }

  const detailItem = useMemo(() => {
    if (!detailItemId) return null;
    for (const shelf of shelves) {
      const found = shelf.items.find((item) => item.id === detailItemId);
      if (found) return found;
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
  } = useStatusTransitions(statusView, "watched");
  const { hiddenIds } = useDelete();

  // See the matching comment in BooksShelvesView.tsx.
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Stage 1: status view + search only — this is what the chip row's own
  // option list and counts are derived from, so "4 not streaming" doesn't
  // change (or disappear) depending on which chip happens to be selected.
  const statusAndSearchFiltered = useMemo(() => {
    return shelves
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => {
          if (hiddenIds.has(i.id)) return false;
          if (!matchesQuery(debouncedQuery, i.title, i.creator)) return false;
          const done = isDone(i);
          const matchesStatus = statusView === "finished" ? done : !done;
          return matchesStatus || leavingView(i.id);
        }),
      }))
      .filter((s) => s.items.length > 0);
  }, [shelves, debouncedQuery, statusView, isDone, leavingView, hiddenIds]);

  const platformOptions = useMemo(() => {
    const names = new Set<string>();
    statusAndSearchFiltered.forEach((s) =>
      s.items.forEach((i) => i.creator && i.creator !== "Unconfirmed" && names.add(i.creator))
    );
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [statusAndSearchFiltered]);

  const notStreamingCount = useMemo(
    () =>
      statusAndSearchFiltered.reduce(
        (sum, s) => sum + s.items.filter((i) => i.meta?.currentlyStreaming === false).length,
        0
      ),
    [statusAndSearchFiltered]
  );
  const unconfirmedCount = useMemo(
    () => statusAndSearchFiltered.reduce((sum, s) => sum + s.items.filter((i) => !!i.meta?.unconfirmed).length, 0),
    [statusAndSearchFiltered]
  );

  // Stage 2: + the selected chip.
  const filtered = useMemo(() => {
    return statusAndSearchFiltered
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => {
          if (platformFilter === "not-streaming") return i.meta?.currentlyStreaming === false;
          if (platformFilter === "unconfirmed") return !!i.meta?.unconfirmed;
          if (platformFilter) return i.creator === platformFilter;
          return true;
        }),
      }))
      .filter((s) => s.items.length > 0);
  }, [statusAndSearchFiltered, platformFilter]);

  const filtersActive = !!platformFilter;
  const platformLabel =
    platformFilter === "not-streaming"
      ? "Not currently streaming"
      : platformFilter === "unconfirmed"
        ? "Unconfirmed"
        : platformFilter || "All services";

  function handleClearFilters() {
    setPlatformFilter("");
  }

  function handleAddFromEmptyState(e: React.MouseEvent<HTMLButtonElement>) {
    // See the matching comment in BooksShelvesView.tsx.
    addButtonRef.current = e.currentTarget;
    setAddInitialTitle(debouncedQuery.trim());
    setAddOpen(true);
  }

  return (
    <>
      <ShelfHeader
        active="shows"
        query={query}
        onQueryChange={setQuery}
        searchLabel="Search shows"
        searchPlaceholder="Title or streaming service"
      />

      <div className="mq-chip-row" role="group" aria-label="Filter by streaming service">
        <button
          type="button"
          aria-pressed={platformFilter === ""}
          className={`mq-chip${platformFilter === "" ? " on" : ""}`}
          onClick={() => setPlatformFilter("")}
        >
          All
        </button>
        {platformOptions.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={platformFilter === name}
            className={`mq-chip${platformFilter === name ? " on" : ""}`}
            onClick={() => setPlatformFilter(name)}
          >
            {name}
          </button>
        ))}
        {notStreamingCount > 0 && (
          <button
            type="button"
            aria-pressed={platformFilter === "not-streaming"}
            className={`mq-chip mq-chip-warn${platformFilter === "not-streaming" ? " on" : ""}`}
            onClick={() => setPlatformFilter("not-streaming")}
          >
            {notStreamingCount} not streaming
          </button>
        )}
        {unconfirmedCount > 0 && (
          <button
            type="button"
            aria-pressed={platformFilter === "unconfirmed"}
            className={`mq-chip mq-chip-warn${platformFilter === "unconfirmed" ? " on" : ""}`}
            onClick={() => setPlatformFilter("unconfirmed")}
          >
            {unconfirmedCount} unconfirmed
          </button>
        )}
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
              message={`No match for "${debouncedQuery.trim()}". Try another title or service, or add it.`}
              action={
                <button type="button" className="mq-empty-btn" onClick={handleAddFromEmptyState}>
                  {`Add "${debouncedQuery.trim()}"`}
                </button>
              }
            />
          ) : statusView === "finished" ? (
            <EmptyState
              heading="Nothing finished yet"
              message="Mark a card watched and it'll show up here."
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
            <ShowShelf
              key={shelf.id}
              shelf={shelf}
              platformLabel={platformLabel}
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
      <AddSheet
        defaultKind="show"
        activeGenre={activeGenre}
        initialTitle={addInitialTitle}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        returnFocusRef={addButtonRef}
      />
      {detailItem && (
        <DetailSheet
          key={detailItem.id}
          item={detailItem}
          kind="show"
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
