import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchShows } from "@/lib/shows/searchShows";

// Type-ahead source for the Add-a-show modal's Title field. Runs on the
// server (TMDB when TMDB_API_KEY is set, else/also TVMaze — see
// lib/shows/searchShows.ts) and is auth-gated like the other API routes.
//
// Deliberately narrow: returns title/year/genre only. Does NOT pull
// watch-provider data — Platform stays fully manual.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ results: [], failed: false });

  return NextResponse.json(await searchShows(q));
}
