"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GENRE_TAGS } from "@/lib/books/genres";
import { SHOW_GENRE_TAGS } from "@/lib/shows/genres";

// Card tap-to-toggle stays binary in v1 (want <-> done) even though the
// schema's `status` is 3-state (want/in_progress/done) — matches the
// original app's read/unread interaction. `in_progress` is schema-supported
// but has no UI trigger yet.
export async function toggleRead(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: current, error: fetchError } = await supabase
    .from("list_items")
    .select("status")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();
  if (fetchError || !current) throw new Error(fetchError?.message ?? "Item not found");

  const nowDone = current.status !== "done";
  // unmarking clears the rating, same as the original app
  const { error } = await supabase
    .from("list_items")
    .update(nowDone ? { status: "done" } : { status: "want", rating: null })
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  // shared action for both media types — cheap to revalidate both paths
  // rather than fetch media_type just to pick one
  revalidatePath("/books");
  revalidatePath("/shows");
}

// Card thumbs stay binary (liked/disliked) even though `rating` is 3-state
// (loved/liked/disliked) — `loved` is only reachable via the onboarding
// "loved books" field, a separate mechanism (user_profile.loved_books).
export async function setRating(itemId: string, rating: "liked" | "disliked") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: current, error: fetchError } = await supabase
    .from("list_items")
    .select("rating")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .single();
  if (fetchError || !current) throw new Error(fetchError?.message ?? "Item not found");

  // clicking an already-active thumb clears the rating, same as the original
  const nextRating = current.rating === rating ? null : rating;
  const { error } = await supabase
    .from("list_items")
    .update({ rating: nextRating })
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/books");
  revalidatePath("/shows");
}

export async function addManualBook(input: {
  title: string;
  author: string;
  genre: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const title = input.title.trim();
  const author = input.author.trim();
  if (!title) throw new Error("Title is required");
  if (!author) throw new Error("Author is required");
  if (!GENRE_TAGS.includes(input.genre)) {
    throw new Error("Genre must match an existing shelf");
  }

  const { error } = await supabase.from("list_items").upsert(
    [
      {
        user_id: user.id,
        media_type: "book" as const,
        title,
        creator: author,
        genre: input.genre,
        status: "want" as const,
        meta: { source_status: "want" },
      },
    ],
    { onConflict: "user_id,media_type,title,creator", ignoreDuplicates: true }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/books");
}

export async function addManualShow(input: {
  title: string;
  platform: string;
  genre: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const title = input.title.trim();
  const platform = input.platform.trim();
  if (!title) throw new Error("Title is required");
  if (!platform) throw new Error("Platform is required");
  if (!SHOW_GENRE_TAGS.includes(input.genre)) {
    throw new Error("Genre must match an existing shelf");
  }

  const { error } = await supabase.from("list_items").upsert(
    [
      {
        user_id: user.id,
        media_type: "show" as const,
        title,
        creator: platform,
        genre: input.genre,
        status: "want" as const,
        meta: { currentlyStreaming: true },
      },
    ],
    { onConflict: "user_id,media_type,title,creator", ignoreDuplicates: true }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/shows");
}
