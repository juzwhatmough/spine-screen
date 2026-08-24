"use client";

import { useMemo, useState } from "react";
import { ShelfNav } from "@/components/books/ShelfNav";
import { ShowShelf } from "./ShowShelf";
import { AddShowFab } from "./AddShowFab";
import { FilterBar } from "@/components/filters/FilterBar";
import { StatusToggle, type StatusView } from "@/components/ui/StatusToggle";
import { useStatusTransitions } from "@/lib/hooks/useStatusTransitions";
import type { ShowShelfData } from "@/lib/shows/groupItems";

// Same pattern as BooksShelvesView.tsx (Genre + Platform instead of
// Genre + Author, no author-group nesting). Platform comes from
// `item.creator` — see types/database.ts's ListItemMeta comment for why
// shows store platform there instead of a dedicated column.
export function ShowsShelvesView({ shelves }: { shelves: ShowShelfData[] }) {
  const [statusView, setStatusView] = useState<StatusView>("shelf");
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | undefined>(shelves[0]?.tag);

  const { isDone, getRating, animatingOut, handleStatusChange, handleRatingChange } =
    useStatusTransitions(statusView);

  const genreOptions = useMemo(() => shelves.map((s) => s.tag), [shelves]);
  const platformOptions = useMemo(() => {
    const names = new Set<string>();
    shelves.forEach((s) => s.items.forEach((i) => i.creator && names.add(i.creator)));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [shelves]);

  const filtered = useMemo(() => {
    return shelves
      .filter((s) => !genre || s.tag === genre)
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => {
          if (platform && i.creator !== platform) return false;
          const done = isDone(i);
          const matchesStatus = statusView === "finished" ? done : !done;
          return matchesStatus || animatingOut.has(i.id);
        }),
      }))
      .filter((s) => s.items.length > 0);
  }, [shelves, genre, platform, statusView, isDone, animatingOut]);

  const titleCount = useMemo(
    () => filtered.reduce((sum, s) => sum + s.items.length, 0),
    [filtered]
  );
  const notStreamingCount = useMemo(
    () =>
      filtered.reduce(
        (sum, s) => sum + s.items.filter((i) => i.meta?.currentlyStreaming === false).length,
        0
      ),
    [filtered]
  );

  function handleFilterChange(id: string, value: string) {
    if (id === "genre") setGenre(value);
    if (id === "platform") setPlatform(value);
  }

  function handleClear() {
    setGenre("");
    setPlatform("");
  }

  return (
    <>
      <StatusToggle value={statusView} onChange={setStatusView} />

      <div className="stats">
        <span>
          <b>{filtered.length}</b> shelves
        </span>
        <span>
          <b>{titleCount}</b> titles
        </span>
        {notStreamingCount > 0 && (
          <span>
            <b>{notStreamingCount}</b> not currently streaming
          </span>
        )}
        <span>Tap a card to mark it watched, then rate it</span>
      </div>

      <FilterBar
        filters={[
          { id: "genre", label: "Genre", value: genre, options: genreOptions },
          { id: "platform", label: "Streaming Service", value: platform, options: platformOptions },
        ]}
        onChange={handleFilterChange}
        onClear={handleClear}
      />

      <ShelfNav
        shelves={filtered.map((s) => ({ id: s.id, tag: s.tag }))}
        onActiveChange={setActiveGenre}
      />

      <main>
        {filtered.length === 0 ? (
          <p className="empty-state">
            {statusView === "finished"
              ? "Nothing finished yet in this combination — mark a card watched and it'll show up here."
              : "Nothing on your shelves matches that combination yet — try clearing a filter, or tap the + button to add something new."}
          </p>
        ) : (
          filtered.map((shelf) => (
            <ShowShelf
              key={shelf.id}
              shelf={shelf}
              animatingOut={animatingOut}
              isDone={isDone}
              getRating={getRating}
              onItemStatusChange={handleStatusChange}
              onItemRatingChange={handleRatingChange}
            />
          ))
        )}
      </main>

      <AddShowFab activeGenre={activeGenre} />
    </>
  );
}
