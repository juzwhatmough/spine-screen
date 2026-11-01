"use client";

import { useState } from "react";
import { MarqueeLights } from "@/components/ui/MarqueeLights";
import { TabNav } from "./TabNav";

// Marquee lights + the "THE SHELF" title row / search toggle (section 4.2
// and 5.5) + the Books/Shows segmented control. Moved here from
// app/books/page.tsx and app/shows/page.tsx (Server Components) because
// the search toggle needs client state — `query` is owned by the parent
// *ShelvesView so it can feed the same filtered memo the chips and
// status view already go through.
export function ShelfHeader({
  active,
  query,
  onQueryChange,
  searchLabel,
  searchPlaceholder,
}: {
  active: "books" | "shows";
  query: string;
  onQueryChange: (query: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
}) {
  const [searching, setSearching] = useState(false);

  function closeSearch() {
    setSearching(false);
    onQueryChange("");
  }

  return (
    <>
      <MarqueeLights />
      {searching ? (
        <div className="mq-search-row">
          <div className="mq-search-field">
            <svg aria-hidden="true" className="mq-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <label className="mq-sr-only" htmlFor="shelf-search-input">
              {searchLabel}
            </label>
            <input
              id="shelf-search-input"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoFocus
              value={query}
              placeholder={searchPlaceholder}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeSearch();
              }}
            />
          </div>
          <button type="button" className="mq-search-cancel" onClick={closeSearch}>
            Cancel
          </button>
        </div>
      ) : (
        <header className="mq-shelf-header">
          <h1 className="mq-title">The Shelf</h1>
          <button
            type="button"
            className="mq-search-btn"
            aria-label={searchLabel}
            onClick={() => setSearching(true)}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>
        </header>
      )}
      <TabNav active={active} />
    </>
  );
}
