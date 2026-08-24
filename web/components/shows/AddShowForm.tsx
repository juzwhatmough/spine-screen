"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addManualShow } from "@/lib/actions/listItems";
import { SHOW_GENRE_TAGS } from "@/lib/shows/genres";
import { searchShows, type ShowSuggestion } from "@/lib/shows/tmdbSearch";

const SEARCH_DEBOUNCE_MS = 300;

// Lives inside a Modal now (see components/shows/AddShowFab.tsx) — no
// longer renders its own section/title. There's still no AI/onboarding
// path for Shows (the original static feature never had one either) —
// this is the only way a non-Juz user builds up their Shows list at all.
// See AddBookForm.tsx for why `initialGenre` doesn't need an effect to
// stay in sync.
//
// Same debounced-search-and-dropdown pattern as AddBookForm.tsx, but
// backed by TMDB via the server route (app/api/shows/search/route.ts —
// the key has to stay server-side, unlike Google Books) and populating
// only Title/Genre. Platform is never touched by this — it stays fully
// manual, on purpose (see the route's comment).
export function AddShowForm({
  initialGenre,
  onSuccess,
}: {
  initialGenre?: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [genre, setGenre] = useState(
    initialGenre && SHOW_GENRE_TAGS.includes(initialGenre) ? initialGenre : SHOW_GENRE_TAGS[0]
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [suggestions, setSuggestions] = useState<ShowSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const handle = setTimeout(() => {
      const trimmed = title.trim();
      if (trimmed.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      searchShows(trimmed).then((results) => {
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [title]);

  function selectSuggestion(s: ShowSuggestion) {
    skipNextSearch.current = true;
    setTitle(s.title);
    if (s.genre) setGenre(s.genre);
    setShowDropdown(false);
    setSuggestions([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addManualShow({ title, platform, genre });
        router.refresh();
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add that show");
      }
    });
  }

  return (
    <>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field autocomplete-wrap">
          <label htmlFor="show-title">Title</label>
          <input
            id="show-title"
            type="text"
            required
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          {showDropdown && (
            <div className="autocomplete-dropdown">
              {suggestions.map((s, i) => (
                <button
                  type="button"
                  key={i}
                  className="autocomplete-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                >
                  {s.title}
                  {s.year && <span className="ac-meta">{s.year}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="field">
          <label htmlFor="show-platform">Platform</label>
          <input
            id="show-platform"
            type="text"
            required
            placeholder="Netflix, Stan…"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="show-genre">Genre</label>
          <select id="show-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
            {SHOW_GENRE_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="primary-btn" disabled={isPending}>
          {isPending ? "Adding…" : "Add"}
        </button>
      </form>
    </>
  );
}
