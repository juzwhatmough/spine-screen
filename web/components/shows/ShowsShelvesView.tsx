"use client";

import { useMemo, useState } from "react";
import { ShelfNav } from "@/components/books/ShelfNav";
import { ShowShelf } from "./ShowShelf";
import { AddShowFab } from "./AddShowFab";
import { FilterBar } from "@/components/filters/FilterBar";
import type { ShowShelfData } from "@/lib/shows/groupItems";

// Same pattern as BooksShelvesView.tsx (Genre + Platform instead of
// Genre + Author). Platform comes from `item.creator` — see
// types/database.ts's ListItemMeta comment for why shows store platform
// there instead of a dedicated column.
export function ShowsShelvesView({ shelves }: { shelves: ShowShelfData[] }) {
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | undefined>(shelves[0]?.tag);

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
        items: s.items.filter((i) => !platform || i.creator === platform),
      }))
      .filter((s) => s.items.length > 0);
  }, [shelves, genre, platform]);

  function handleChange(id: string, value: string) {
    if (id === "genre") setGenre(value);
    if (id === "platform") setPlatform(value);
  }

  function handleClear() {
    setGenre("");
    setPlatform("");
  }

  return (
    <>
      <FilterBar
        filters={[
          { id: "genre", label: "Genre", value: genre, options: genreOptions },
          { id: "platform", label: "Streaming Service", value: platform, options: platformOptions },
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
          filtered.map((shelf) => <ShowShelf key={shelf.id} shelf={shelf} />)
        )}
      </main>

      <AddShowFab activeGenre={activeGenre} />
    </>
  );
}
