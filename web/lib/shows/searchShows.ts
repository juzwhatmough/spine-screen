import { mapTmdbGenresToShelf } from "./tmdbGenres";
import { SHOW_GENRE_TAGS } from "./genres";

export type ShowSuggestion = {
  title: string;
  year: string;
  genre: string | undefined; // one of SHOW_GENRE_TAGS, or undefined if no confident mapping
};

// Server-side search for the Add-a-show modal. TMDB first when a
// TMDB_API_KEY is set (movies + series), otherwise — or if TMDB errors or
// finds nothing — TVMaze, which is free with no key (series only).
// `failed` is true only if every source errored, so the form can tell
// "no matches" apart from "search unavailable".
export async function searchShows(query: string): Promise<{ results: ShowSuggestion[]; failed: boolean }> {
  let anyOk = false;

  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
          query
        )}&include_adult=false`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        anyOk = true;
        const data: TmdbSearchResponse = await res.json();
        const results = (data.results ?? [])
          .filter((r) => r.media_type === "movie" || r.media_type === "tv")
          .slice(0, 5)
          .map((r) => ({
            title: r.title ?? r.name ?? "",
            year: (r.release_date ?? r.first_air_date ?? "").slice(0, 4),
            genre: mapTmdbGenresToShelf(r.genre_ids ?? []),
          }))
          .filter((r) => r.title);
        if (results.length) return { results, failed: false };
      }
    } catch {
      // fall through to TVMaze
    }
  }

  try {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      anyOk = true;
      const data: { show?: TvMazeShow }[] = await res.json();
      const results = data
        .map((d) => d.show)
        .filter((s): s is TvMazeShow => !!s?.name)
        .slice(0, 5)
        .map((s) => ({
          title: s.name,
          year: s.premiered?.slice(0, 4) ?? "",
          genre: mapTvMazeGenre(s),
        }));
      return { results, failed: false };
    }
  } catch {
    // handled below
  }

  return { results: [], failed: !anyOk };
}

function mapTvMazeGenre(show: TvMazeShow): string | undefined {
  const g = new Set((show.genres ?? []).map((x) => x.toLowerCase()));
  const has = (n: string) => g.has(n);
  let tag: string | undefined;
  if (show.type === "Documentary") tag = has("crime") ? "True Crime" : "Documentary";
  else if (has("crime") || has("mystery") || has("thriller")) tag = "Thriller & Mystery";
  else if (has("history")) tag = "Period Drama";
  else if (has("romance")) tag = "Romance";
  else if (has("science-fiction") || has("fantasy")) tag = "Sci-Fi & Fantasy";
  else if (has("comedy")) tag = "Comedy";
  else if (has("drama")) tag = "Drama";
  return tag && SHOW_GENRE_TAGS.includes(tag) ? tag : undefined;
}

type TvMazeShow = { name: string; premiered?: string | null; genres?: string[]; type?: string };

type TmdbSearchResponse = {
  results?: Array<{
    media_type?: string;
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    genre_ids?: number[];
  }>;
};
