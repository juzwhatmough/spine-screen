"use server";

import { createClient } from "@/lib/supabase/server";
import { JUZ_SEED_SHOWS } from "@/lib/shows/seedData";

// Same pattern as seedJuz.ts (books): called directly from
// app/shows/page.tsx's server-side gate when the signed-in email matches
// JUZ_EMAIL and she has zero show list_items. `creator` stores the
// streaming platform (not an author — shows don't have one) so the
// existing list_items_user_unique_title index still dedupes correctly;
// see types/database.ts's ListItemMeta comment for why.
export async function seedJuzShows() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !process.env.JUZ_EMAIL || user.email !== process.env.JUZ_EMAIL) {
    throw new Error("Not authorized");
  }

  const rows = JUZ_SEED_SHOWS.map((s) => ({
    user_id: user.id,
    media_type: "show" as const,
    title: s.title,
    creator: s.platform,
    genre: s.genre,
    status: "want" as const,
    meta: { hook: s.hook, note: s.note, currentlyStreaming: s.currentlyStreaming },
  }));

  const { error } = await supabase
    .from("list_items")
    .upsert(rows, { onConflict: "user_id,media_type,title,creator", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}
