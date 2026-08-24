"use client";

import { GENRE_TAGS } from "./genres";

export type BookSuggestion = {
  title: string;
  author: string;
  year: string;
  genre: string | undefined; // one of GENRE_TAGS, or undefined if no confident mapping
};

// No API key needed for basic volume search (confirmed against Google's
// own docs — this project's sandbox network had its shared anonymous
// quota exhausted when this was built, so the mapping below is built
// against the documented response shape, not a live-verified one; worth
// a real smoke test once deployed). Called directly from the browser —
// Google Books' volumes endpoint supports CORS for GET requests, so no
// server proxy is needed the way TMDB's search does (see
// app/api/shows/search/route.ts).
export async function searchGoogleBooks(query: string): Promise<BookSuggestion[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    query
  )}&maxResults=5`;

  let data: { items?: GoogleBooksItem[] };
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    data = await res.json();
  } catch {
    return [];
  }

  return (data.items ?? [])
    .map((item) => {
      const info = item.volumeInfo;
      if (!info?.title) return null;
      return {
        title: info.title,
        author: info.authors?.join(", ") ?? "",
        year: info.publishedDate?.slice(0, 4) ?? "",
        genre: mapGoogleBooksCategoryToGenre(info.categories),
      };
    })
    .filter((s): s is BookSuggestion => s !== null);
}

type GoogleBooksItem = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    categories?: string[];
  };
};

// Heuristic, priority-ordered, deliberately conservative — Google Books'
// category taxonomy (BISAC-derived strings like "Fiction / Historical",
// "Fiction / Thrillers", "Biography & Autobiography") doesn't map
// cleanly onto this app's 5 hand-curated shelves, so this only maps the
// unambiguous cases and leaves everything else undefined for the user to
// pick themselves — never guesses wrong on purpose by forcing a fit.
export function mapGoogleBooksCategoryToGenre(categories?: string[]): string | undefined {
  if (!categories?.length) return undefined;
  const joined = categories.join(" / ").toLowerCase();

  if (/\b(war|historical|history)\b/.test(joined)) {
    return findGenre("WWII & Historical Fiction");
  }
  if (/\b(thriller|suspense|mystery|crime)\b/.test(joined)) {
    return findGenre("Psychological Thriller & Domestic Suspense");
  }
  if (/\b(humor|humorous|comedy|family)\b/.test(joined)) {
    return findGenre("Contemporary Comedy & Family Life");
  }
  if (/\b(biography|autobiography|memoir|nonfiction|non-fiction)\b/.test(joined)) {
    return findGenre("Narrative Nonfiction");
  }
  if (/\bfiction\b/.test(joined)) {
    // generic "Fiction" with nothing more specific matched above — closest
    // available shelf is Literary Fiction, not a confident match but a
    // reasonable default rather than leaving every plain-fiction result unset
    return findGenre("Literary Fiction");
  }
  return undefined;
}

function findGenre(tag: string): string | undefined {
  return GENRE_TAGS.includes(tag) ? tag : undefined;
}
