"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuProviders, searchShows } from "@/lib/shows/searchShows";

export type AvailabilityResult =
  | { status: "found"; matchedTitle: string; year: string; providers: string[] }
  // Matched a title but TMDB lists no Australian subscription/free service
  // (rent/buy only, or no data).
  | { status: "none"; matchedTitle: string; year: string }
  | { status: "no-match" }
  | { status: "error" };

// Read-only lookup: where does this saved show stream in Australia right
// now? Never writes anything — the user accepts a suggestion explicitly,
// which goes through updateShowPlatform like any manual edit.
export async function lookupShowAvailability(title: string): Promise<AvailabilityResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error" };

  const query = title.trim();
  if (query.length < 2) return { status: "no-match" };

  const { results, failed } = await searchShows(query);
  if (failed) return { status: "error" };

  // Prefer an exact title match over TMDB's popularity ordering.
  const exact = results.find((r) => r.title.toLowerCase() === query.toLowerCase());
  const match = exact ?? results[0];
  if (!match) return { status: "no-match" };

  const providers =
    match.tmdbId && match.mediaType ? await getAuProviders(match.tmdbId, match.mediaType) : [];
  return providers.length
    ? { status: "found", matchedTitle: match.title, year: match.year, providers }
    : { status: "none", matchedTitle: match.title, year: match.year };
}
