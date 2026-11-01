"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addManualShow } from "@/lib/actions/listItems";
import { SHOW_GENRE_TAGS } from "@/lib/shows/genres";
import { searchShows, fetchAuProviders, type ShowSuggestion } from "@/lib/shows/tmdbSearch";

const SEARCH_DEBOUNCE_MS = 300;

// Fixed platform chip set (web/REDESIGN_SPEC.md section 8.2) — "Other"
// reveals a free-text input. The platform is still always typed or
// picked by a human, never autofilled from the TMDB search below; see
// the route's comment for why.
const PLATFORM_CHIPS = ["Netflix", "Stan", "Binge", "Disney+", "Prime Video", "Apple TV+"];

// Lives inside the shared Add sheet now (see
// components/shared/AddSheet.tsx) — no longer renders its own
// section/title. There's still no AI/onboarding path for Shows (the
// original static feature never had one either) — this is the only way
// a non-Juz user builds up their Shows list at all. See AddBookForm.tsx
// for why `initialGenre` doesn't need an effect to stay in sync.
//
// Same debounced-search-and-dropdown pattern as AddBookForm.tsx, but
// backed by TMDB via the server route (app/api/shows/search/route.ts —
// the key has to stay server-side, unlike Google Books) and populating
// only Title/Genre. Platform is never touched by this — it stays fully
// manual, on purpose (see the route's comment).
export function AddShowForm({
  initialGenre,
  initialTitle,
  onSuccess,
}: {
  initialGenre?: string;
  initialTitle?: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [platform, setPlatform] = useState("");
  const [genre, setGenre] = useState(
    initialGenre && SHOW_GENRE_TAGS.includes(initialGenre) ? initialGenre : SHOW_GENRE_TAGS[0]
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isCanonicalPlatform = PLATFORM_CHIPS.includes(platform.trim());

  const [suggestions, setSuggestions] = useState<ShowSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  // Services TMDB says it streams on in Australia (for the picked title)
  const [providers, setProviders] = useState<string[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "searching" | "none" | "error">("idle");
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
        setSearchState("idle");
        return;
      }
      setSearchState("searching");
      searchShows(trimmed).then(({ results, failed }) => {
        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setSearchState(results.length > 0 ? "idle" : failed ? "error" : "none");
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [title]);

  function selectSuggestion(s: ShowSuggestion) {
    skipNextSearch.current = true;
    setTitle(s.title);
    if (s.genre) setGenre(s.genre);
    setProviders([]);
    if (s.tmdbId && s.mediaType) {
      fetchAuProviders(s.tmdbId, s.mediaType).then((names) => {
        setProviders(names);
        // pre-fill only if the user hasn't typed a service themselves
        setPlatform((current) => (current.trim() ? current : names[0] ?? ""));
      });
    }
    setShowDropdown(false);
    setSuggestions([]);
    setSearchState("idle");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addManualShow({
          title,
          platform,
          genre,
          platformFromSuggestion: providers.includes(platform.trim()),
        });
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
          {searchState !== "idle" && !showDropdown && (
            <p className="search-hint" role="status">
              {searchState === "searching"
                ? "Searching…"
                : searchState === "none"
                  ? "No matches found — fill in the details below."
                  : "Title search is unavailable right now — fill in the details below."}
            </p>
          )}
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
          <label id="show-platform-label">Platform</label>
          <div className="mq-add-chip-group" role="group" aria-labelledby="show-platform-label">
            {PLATFORM_CHIPS.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={platform.trim() === name}
                className={`mq-add-chip${platform.trim() === name ? " on" : ""}`}
                onClick={() => setPlatform(name)}
              >
                {name}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={!isCanonicalPlatform}
              className={`mq-add-chip${!isCanonicalPlatform ? " on" : ""}`}
              onClick={() => {
                if (isCanonicalPlatform) setPlatform("");
              }}
            >
              Other
            </button>
          </div>
          {!isCanonicalPlatform && (
            <input
              type="text"
              required
              placeholder="Streaming service"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{ marginTop: 10 }}
            />
          )}
          {providers.length > 0 && (
            <>
              <p className="search-hint" style={{ marginTop: 10 }}>
                Suggested from TMDB (data from JustWatch) — tap to select:
              </p>
              <div className="mq-add-chip-group">
                {providers.map((name) => (
                  <button
                    type="button"
                    key={name}
                    aria-pressed={platform.trim() === name}
                    className={`mq-add-chip${platform.trim() === name ? " on" : ""}`}
                    onClick={() => setPlatform(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="field">
          <label id="show-genre-label">Genre</label>
          <div className="mq-add-chip-group" role="group" aria-labelledby="show-genre-label">
            {SHOW_GENRE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={genre === tag}
                className={`mq-add-chip${genre === tag ? " on" : ""}`}
                onClick={() => setGenre(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="primary-btn" disabled={isPending}>
          {isPending ? "Adding…" : "+ Add show"}
        </button>
      </form>
    </>
  );
}
