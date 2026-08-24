import { SHOW_GENRE_TAGS } from "./genres";

// TMDB's genre IDs are stable/public (documented at
// https://developer.themoviedb.org/reference/genre-movie-list and
// .../genre-tv-list) — hardcoded here rather than fetched, since fetching
// them would be a second API call per search for a fixed, rarely-changing
// list. Movie and TV genre sets overlap for most entries; where they
// differ (Action vs Action & Adventure, Sci-Fi & Fantasy is TV-only,
// War vs War & Politics) both ids are included.
const TMDB_GENRE_NAMES: Record<number, string> = {
  28: "Action",
  10759: "Action & Adventure",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10762: "Kids",
  10402: "Music",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10749: "Romance",
  878: "Science Fiction",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10770: "TV Movie",
  10767: "Talk",
  53: "Thriller",
  10752: "War",
  10768: "War & Politics",
  37: "Western",
};

export function tmdbGenreNames(genreIds: number[]): string[] {
  return genreIds.map((id) => TMDB_GENRE_NAMES[id]).filter((n): n is string => !!n);
}

// Priority-ordered, same philosophy as
// lib/books/googleBooksSearch.ts's mapGoogleBooksCategoryToGenre: only
// maps the reasonably unambiguous cases, leaves the rest undefined for
// the user to pick. Checked against the *set* of genre names TMDB
// returns for a title, not just the first one, since a title is often
// tagged with several.
export function mapTmdbGenresToShelf(genreIds: number[]): string | undefined {
  const names = new Set(tmdbGenreNames(genreIds));
  const has = (n: string) => names.has(n);

  if (has("Crime") && has("Documentary")) return findGenre("True Crime");
  if (has("Documentary")) return findGenre("Documentary");
  if (has("Mystery") || has("Thriller") || has("Crime")) return findGenre("Thriller & Mystery");
  if (has("History")) return findGenre("Period Drama");
  if (has("Romance")) return findGenre("Romance");
  if (has("Science Fiction") || has("Fantasy") || has("Sci-Fi & Fantasy")) {
    return findGenre("Sci-Fi & Fantasy");
  }
  if (has("Comedy")) return findGenre("Comedy");
  if (has("Drama")) return findGenre("Drama");
  return undefined;
}

function findGenre(tag: string): string | undefined {
  return SHOW_GENRE_TAGS.includes(tag) ? tag : undefined;
}
