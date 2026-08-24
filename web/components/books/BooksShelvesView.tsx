"use client";

import { useMemo, useState } from "react";
import { ShelfNav } from "./ShelfNav";
import { BookShelf } from "./BookShelf";
import { AddBookFab } from "./AddBookFab";
import { FilterBar } from "@/components/filters/FilterBar";
import type { BookShelfData } from "@/lib/books/groupItems";

// Client boundary that owns filter state and does the actual client-side
// AND-filtering — the server page just fetches + groups the data and
// hands it down. BookShelf/AuthorGroup have no server-only imports so
// they're safe to render from here even though they aren't marked
// "use client" themselves.
export function BooksShelvesView({ shelves }: { shelves: BookShelfData[] }) {
  const [genre, setGenre] = useState("");
  const [author, setAuthor] = useState("");
  // Tracks whichever shelf is currently in view (ShelfNav's scroll-spy),
  // used only to pre-fill the Add-a-book modal's Genre field.
  const [activeGenre, setActiveGenre] = useState<string | undefined>(shelves[0]?.tag);

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
        groups: s.groups.filter((g) => !author || g.author === author),
      }))
      .filter((s) => s.groups.length > 0);
  }, [shelves, genre, author]);

  function handleChange(id: string, value: string) {
    if (id === "genre") setGenre(value);
    if (id === "author") setAuthor(value);
  }

  function handleClear() {
    setGenre("");
    setAuthor("");
  }

  return (
    <>
      <FilterBar
        filters={[
          { id: "genre", label: "Genre", value: genre, options: genreOptions },
          { id: "author", label: "Author", value: author, options: authorOptions },
        ]}
        onChange={handleChange}
        onClear={handleClear}
      />

      <ShelfNav
        shelves={filtered.map((s) => ({ id: s.id, tag: s.tag }))}
        onActiveChange={setActiveGenre}
      />

      <main>
        {filtered.length === 0 ? (
          <p className="empty-state">
            Nothing on your shelves matches that combination yet — try
            clearing a filter, or tap the + button to add something new.
          </p>
        ) : (
          filtered.map((shelf) => <BookShelf key={shelf.id} shelf={shelf} />)
        )}
      </main>

      <AddBookFab activeGenre={activeGenre} />
    </>
  );
}
