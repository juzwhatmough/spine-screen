"use client";

export type { BookSuggestion } from "./searchBooks";
import type { BookSuggestion } from "./searchBooks";

// Thin client wrapper around app/api/books/search/route.ts. The search runs
// on the server so it isn't affected by browser/network blocking or CORS.
// `failed` lets the form say "search unavailable" instead of silently
// showing nothing.
export async function searchGoogleBooks(
  query: string
): Promise<{ results: BookSuggestion[]; failed: boolean }> {
  try {
    const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
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
