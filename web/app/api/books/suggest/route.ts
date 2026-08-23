import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestBooks } from "@/lib/anthropic/suggestBooks";
import type { ListItemRow } from "@/types/database";

// Ported from the-to-read-shelf/api/suggest.js. Deviation from a pure 1:1
// port: the original had no auth check (fine for a public single-tenant
// static site with no accounts) — this route has real accounts and a real
// per-request API bill, so unauthenticated calls are rejected.
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

  const { data: items, error } = await supabase
    .from("list_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("media_type", "book")
    .eq("genre", genre);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (items ?? []) as ListItemRow[];
  const authorsOnShelf = [...new Set(rows.map((r) => r.creator).filter((c): c is string => !!c))];
  const likedTitles = rows.filter((r) => r.rating === "liked" || r.rating === "loved").map((r) => r.title);
  const dislikedTitles = rows.filter((r) => r.rating === "disliked").map((r) => r.title);
  const avoidTitles = rows.map((r) => r.title);

  let suggestions;
  try {
    suggestions = await suggestBooks({
      genre,
      authorsOnShelf,
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
    .filter((s) => s.title && s.author && !avoidSet.has(s.title.toLowerCase()))
    .map((s) => {
      const isKnownAuthor = authorsOnShelf.some(
        (a) => a.toLowerCase() === s.author.toLowerCase()
      );
      return {
        user_id: user.id,
        media_type: "book" as const,
        title: s.title,
        creator: s.author,
        genre,
        status: "want" as const,
        meta: {
          hook: s.hook ?? "",
          source_status: isKnownAuthor
            ? ("ai-known" as const)
            : ("ai" as const),
        },
      };
    });

  if (toInsert.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }

  // upsert + ignoreDuplicates (INSERT ... ON CONFLICT DO NOTHING) against
  // list_items_user_unique_title — a repeat suggestion that matches
  // something already on the shelf silently no-ops instead of erroring.
  // Only actually-inserted rows come back in `data`.
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
