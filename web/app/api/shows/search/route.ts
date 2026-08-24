import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mapTmdbGenresToShelf } from "@/lib/shows/tmdbGenres";

// Type-ahead source for the Add-a-show modal's Title field — TMDB
// requires an API key, so unlike Google Books (called directly from the
// browser, see lib/books/googleBooksSearch.ts) this has to be a server
// route: TMDB_API_KEY stays server-side only, same pattern as
// ANTHROPIC_API_KEY. Auth-gated like the other API routes, partly to
// keep this project's TMDB quota from being drained by anyone who finds
// the URL.
//
// Deliberately narrow: returns title/year/genre only. Does NOT pull
// TMDB's watch-provider data — Platform stays fully manual, out of scope
// for this batch per the ticket.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query || query.trim().length < 3) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing TMDB_API_KEY. Add it in Vercel > Project Settings > Environment Variables." },
      { status: 500 }
    );
  }

  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
    query
  )}&include_adult=false`;

  let data: TmdbSearchResponse;
  try {
    const tmdbRes = await fetch(url);
    if (!tmdbRes.ok) {
      return NextResponse.json({ error: "TMDB request failed" }, { status: 502 });
    }
    data = await tmdbRes.json();
  } catch {
    return NextResponse.json({ error: "TMDB request failed" }, { status: 502 });
  }

  const results = (data.results ?? [])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 5)
    .map((r) => {
      const title = r.title ?? r.name ?? "";
      const dateStr = r.release_date ?? r.first_air_date ?? "";
      return {
        title,
        year: dateStr.slice(0, 4),
        genre: mapTmdbGenresToShelf(r.genre_ids ?? []),
      };
    })
    .filter((r) => r.title);

  return NextResponse.json({ results });
}

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
