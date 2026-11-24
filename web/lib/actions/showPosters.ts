"use server";

import { createClient } from "@/lib/supabase/server";
import { findPosterPath } from "@/lib/shows/poster";
import type { ListItemRow } from "@/types/database";

const BATCH_SIZE = 20;

// Fills in posters for shows that don't have one yet (e.g. the original 93
// seeded shows). Called from the Shows page in the background; each call
// handles up to BATCH_SIZE shows, and the page asks again until none are
// left. Titles TMDB can't match confidently are stamped `posterCheckedAt`
// so they keep the coloured card and aren't looked up again.
//
// Returns how many shows got a poster, and how many still need checking.
export async function backfillShowPosters(): Promise<{ updated: number; remaining: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("list_items")
    .select("id, title, meta")
    .eq("user_id", user.id)
    .eq("media_type", "show");
  if (error) throw new Error(error.message);

  const todo = ((data ?? []) as Pick<ListItemRow, "id" | "title" | "meta">[]).filter(
    (r) => !r.meta?.posterPath && !r.meta?.posterCheckedAt
  );
  const batch = todo.slice(0, BATCH_SIZE);

  let updated = 0;
  let answered = 0;
  await Promise.all(
    batch.map(async (row) => {
      const poster = await findPosterPath(row.title);
      if (poster.status === "error") return; // leave unchecked, retry next visit
      answered++;
      const meta = {
        ...row.meta,
        posterCheckedAt: new Date().toISOString(),
        ...(poster.status === "found" ? { posterPath: poster.path } : {}),
      };
      const { error: updateError } = await supabase
        .from("list_items")
        .update({ meta })
        .eq("id", row.id)
        .eq("user_id", user.id);
      if (!updateError && poster.status === "found") updated++;
    })
  );

  // If nothing in the batch got an answer (no TMDB key, or TMDB is down),
  // report 0 remaining so the page stops asking instead of looping.
  return { updated, remaining: answered === 0 ? 0 : todo.length - answered };
}
