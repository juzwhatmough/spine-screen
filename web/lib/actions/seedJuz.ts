"use server";

import { createClient } from "@/lib/supabase/server";
import { JUZ_SEED_BOOKS } from "@/lib/books/seedData";

// Called directly from app/books/page.tsx's server-side gate (not from a
// form) when the signed-in email matches JUZ_EMAIL and she has zero book
// list_items — no onboarding UI shown to her at all. She already has a real
// curated library; making her answer onboarding questions about favorite
// authors/genres she's already expressed through 70 real books adds
// friction for no benefit. Guarded two ways against double-seeding: the
// JUZ_EMAIL + zero-items check at the call site, and the
// list_items_user_unique_title index (upsert + ignoreDuplicates) here as a
// backstop against a double-submit race.
export async function seedJuzLibrary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !process.env.JUZ_EMAIL || user.email !== process.env.JUZ_EMAIL) {
    throw new Error("Not authorized");
  }

  const rows = JUZ_SEED_BOOKS.map((b) => ({
    user_id: user.id,
    media_type: "book" as const,
    title: b.title,
    creator: b.author,
    genre: b.genre,
    status: "want" as const,
    meta: { hook: b.hook, source_status: b.source_status },
  }));

  const { error } = await supabase
    .from("list_items")
    .upsert(rows, { onConflict: "user_id,media_type,title,creator", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}
