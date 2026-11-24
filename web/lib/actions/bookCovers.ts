"use server";

import { createClient } from "@/lib/supabase/server";
import { findCoverId } from "@/lib/books/cover";
import type { ListItemRow } from "@/types/database";

const BATCH_SIZE = 15;

// Fills in covers for books that don't have one yet (e.g. the original 70
// seeded books). Called from the Books page in the background; each call
// handles up to BATCH_SIZE books and the page asks again until none are
// left. Books Open Library can't match confidently are stamped
// `coverCheckedAt` so they keep the coloured card and aren't looked up again.
export async function backfillBookCovers(): Promise<{ updated: number; remaining: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("list_items")
    .select("id, title, creator, meta")
    .eq("user_id", user.id)
    .eq("media_type", "book");
  if (error) throw new Error(error.message);

  const todo = ((data ?? []) as Pick<ListItemRow, "id" | "title" | "creator" | "meta">[]).filter(
    (r) => !r.meta?.coverId && !r.meta?.coverCheckedAt
  );
  const batch = todo.slice(0, BATCH_SIZE);

  let updated = 0;
  let answered = 0;
  await Promise.all(
    batch.map(async (row) => {
      const cover = await findCoverId(row.title, row.creator);
      if (cover.status === "error") return; // leave unchecked, retry next visit
      answered++;
      const meta = {
        ...row.meta,
        coverCheckedAt: new Date().toISOString(),
        ...(cover.status === "found" ? { coverId: cover.id } : {}),
      };
      const { error: updateError } = await supabase
        .from("list_items")
        .update({ meta })
        .eq("id", row.id)
        .eq("user_id", user.id);
      if (!updateError && cover.status === "found") updated++;
    })
  );

  // Nothing answered (Open Library down) -> report 0 remaining so the page
  // stops asking instead of looping.
  return { updated, remaining: answered === 0 ? 0 : todo.length - answered };
}
