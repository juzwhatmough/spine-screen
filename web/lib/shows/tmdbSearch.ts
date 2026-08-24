"use client";

export type ShowSuggestion = {
  title: string;
  year: string;
  genre: string | undefined; // one of SHOW_GENRE_TAGS, or undefined if no confident mapping
};

// Thin client wrapper around app/api/shows/search/route.ts. Any failure
// (network, non-200, no results) resolves to an empty array — the
// ticket's "silently fall back to manual entry, no error shown" applies
// here, not just server-side.
export async function searchShows(query: string): Promise<ShowSuggestion[]> {
  try {
    const res = await fetch(`/api/shows/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}
