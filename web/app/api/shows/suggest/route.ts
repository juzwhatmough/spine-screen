import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestShows } from "@/lib/anthropic/suggestShows";
import type { ListItemRow } from "@/types/database";

// Mirrors app/api/books/suggest/route.ts's architecture exactly (auth
// check, DB-level dedup via upsert+ignoreDuplicates) with one deliberate
// difference: every inserted row gets creator: "Unconfirmed" and
// meta.unconfirmed: true instead of a real platform — see
// lib/anthropic/suggestShows.ts for why. ShowCard.tsx renders a distinct
// "unconfirmed" badge for these, separate from the "not currently
// streaming" badge used on seed/manual data with a known platform.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { genre } = (await request.json().catch(() => ({}))) as { genre?: string };
  if (!genre || typeof genre !== "string") {
    return NextResponse.json({ error: "Missing genre" }, { status: 400 });
  }

  const { data: allItems, error: allError } = await supabase
    .from("list_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("media_type", "show");

  if (allError) {
    return NextResponse.json({ error: allError.message }, { status: 500 });
  }

  const allRows = (allItems ?? []) as ListItemRow[];
  const genreRows = allRows.filter((r) => r.genre === genre);
  const titlesOnShelf = genreRows.map((r) => r.title);
  const likedTitles = allRows.filter((r) => r.rating === "liked" || r.rating === "loved").map((r) => r.title);
  const dislikedTitles = allRows.filter((r) => r.rating === "disliked").map((r) => r.title);
  // avoid duplicating anything already anywhere in the user's show list,
  // not just this genre — a title could legitimately span genres
  const avoidTitles = allRows.map((r) => r.title);

  let suggestions;
  try {
    suggestions = await suggestShows({
      genre,
      titlesOnShelf,
      likedTitles,
      dislikedTitles,
      avoidTitles,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Suggestion request failed" },
      { status: 502 }
    );
  }

  const avoidSet = new Set(avoidTitles.map((t) => t.toLowerCase()));
  const toInsert = suggestions
    .filter((s) => s.title && !avoidSet.has(s.title.toLowerCase()))
    .map((s) => ({
      user_id: user.id,
      media_type: "show" as const,
      title: s.title,
      creator: "Unconfirmed",
      genre,
      status: "want" as const,
      meta: { hook: s.hook ?? "", unconfirmed: true },
    }));

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("list_items")
    .upsert(toInsert, {
      onConflict: "user_id,media_type,title,creator",
      ignoreDuplicates: true,
    })
    .select("id");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: inserted?.length ?? 0 });
}
