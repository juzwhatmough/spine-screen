"use client";

import { useMemo, useState } from "react";
import { ShelfNav } from "./ShelfNav";
import { BookShelf } from "./BookShelf";
import { AddBookFab } from "./AddBookFab";
import { FilterBar } from "@/components/filters/FilterBar";
import { StatusToggle, type StatusView } from "@/components/ui/StatusToggle";
import { useStatusTransitions } from "@/lib/hooks/useStatusTransitions";
import type { BookShelfData } from "@/lib/books/groupItems";

// Client boundary that owns filter state and does the actual client-side
// AND-filtering — the server page just fetches + groups the data and
// hands it down. BookShelf/AuthorGroup have no server-only imports so
// they're safe to render from here even though they aren't marked
// "use client" themselves.
//
// Also owns the stats bar now (moved here from the server page) — it
// needs to reflect the currently filtered/status-scoped view, which only
// exists client-side.
export function BooksShelvesView({ shelves }: { shelves: BookShelfData[] }) {
  const [statusView, setStatusView] = useState<StatusView>("shelf");
  const [genre, setGenre] = useState("");
  const [author, setAuthor] = useState("");
  // Tracks whichever shelf is currently in view (ShelfNav's scroll-spy),
  // used only to pre-fill the Add-a-book modal's Genre field.
  const [activeGenre, setActiveGenre] = useState<string | undefined>(shelves[0]?.tag);

  const { isDone, getRating, animatingOut, handleStatusChange, handleRatingChange } =
    useStatusTransitions(statusView);

  const genreOptions = useMemo(() => shelves.map((s) => s.tag), [shelves]);
  const authorOptions = useMemo(() => {
    const names = new Set<string>();
    shelves.forEach((s) => s.groups.forEach((g) => names.add(g.author)));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [shelves]);

  const filtered = useMemo(() => {
    return shelves
      .filter((s) => !genre || s.tag === genre)
      .map((s) => ({
        ...s,
        groups: s.groups
          .filter((g) => !author || g.author === author)
          .map((g) => ({
            ...g,
            items: g.items.filter((item) => {
              const done = isDone(item);
              const matchesStatus = statusView === "finished" ? done : !done;
              return matchesStatus || animatingOut.has(item.id);
            }),
          }))
          .filter((g) => g.items.length > 0),
      }))
      .filter((s) => s.groups.length > 0);
  }, [shelves, genre, author, statusView, isDone, animatingOut]);

  const titleCount = useMemo(
    () => filtered.reduce((sum, s) => sum + s.groups.reduce((n, g) => n + g.items.length, 0), 0),
    [filtered]
  );

  function handleFilterChange(id: string, value: string) {
    if (id === "genre") setGenre(value);
    if (id === "author") setAuthor(value);
  }

  function handleClear() {
    setGenre("");
    setAuthor("");
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
        <span>
          Tap a card to mark it read, then rate it — your ratings shape
          &quot;Suggest more&quot;
        </span>
      </div>

      <FilterBar
        filters={[
          { id: "genre", label: "Genre", value: genre, options: genreOptions },
          { id: "author", label: "Author", value: author, options: authorOptions },
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
              ? "Nothing finished yet in this combination — mark a card read and it'll show up here."
              : "Nothing on your shelves matches that combination yet — try clearing a filter, or tap the + button to add something new."}
          </p>
        ) : (
          filtered.map((shelf) => (
            <BookShelf
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

      <AddBookFab activeGenre={activeGenre} />
    </>
  );
}
