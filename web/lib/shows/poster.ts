// Poster lookup via TMDB (server-side only — needs TMDB_API_KEY).
//
// We store only TMDB's short poster path (e.g. "/abc123.jpg") in
// list_items.meta.posterPath, and build the full image URL at render time
// with posterUrl(). That keeps rows small and lets us change image size later.

export type PosterLookup =
  | { status: "found"; path: string }
  | { status: "none" } // TMDB answered, but no confident match
  | { status: "error" }; // no key, network failure, etc. — worth retrying later

// Normalise so "Mare of Easttown", "Mare Of Easttown!" and "mare of easttown"
// all compare equal. Accents are stripped too.
function normalise(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Conservative on purpose: only accept a result whose title matches the
// query exactly (after normalising) AND has a poster. A wrong poster on a
// card is worse than the coloured fallback, so anything doubtful is "none".
export async function findPosterPath(title: string): Promise<PosterLookup> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return { status: "error" };

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
        title
      )}&include_adult=false`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return { status: "error" };

    const data: {
      results?: Array<{
        media_type?: string;
        title?: string;
        name?: string;
        poster_path?: string | null;
        popularity?: number;
      }>;
    } = await res.json();

    const wanted = normalise(title);
    const matches = (data.results ?? [])
      .filter((r) => (r.media_type === "tv" || r.media_type === "movie") && r.poster_path)
      .filter((r) => normalise(r.title ?? r.name ?? "") === wanted)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

    const best = matches[0]?.poster_path;
    return best ? { status: "found", path: best } : { status: "none" };
  } catch {
    return { status: "error" };
  }
}

// w342 is sharp enough for a ~160px-wide card on a 2x phone screen without
// being heavy to download.
export function posterUrl(path: string, size: "w185" | "w342" = "w342"): string {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
