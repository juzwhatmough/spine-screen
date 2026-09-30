"use client";

import type { ShowSuggestion } from "./searchShows";

export type { ShowSuggestion };

// Thin client wrapper around app/api/shows/search/route.ts. `failed` lets
// the form say "search unavailable" instead of silently showing nothing.
export async function searchShows(
  query: string
): Promise<{ results: ShowSuggestion[]; failed: boolean }> {
  try {
    const res = await fetch(`/api/shows/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return { results: [], failed: true };
    const data = await res.json();
    return {
      results: Array.isArray(data.results) ? data.results : [],
      failed: !!data.failed,
    };
  } catch {
    return { results: [], failed: true };
  }
}

// Where a TMDB title streams in Australia; [] on any failure or no data.
export async function fetchAuProviders(
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<string[]> {
  try {
    const res = await fetch(`/api/shows/providers?id=${tmdbId}&type=${mediaType}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.providers) ? data.providers : [];
  } catch {
    return [];
  }
}
