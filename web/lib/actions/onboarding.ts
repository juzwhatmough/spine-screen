"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { suggestBooks } from "@/lib/anthropic/suggestBooks";
import { GENRE_TAGS } from "@/lib/books/genres";

export type OnboardingInput = {
  favoriteAuthors: string[];
  favoriteGenres: string[]; // canonical GENRE_TAGS entries + free-text "Other" values
  lovedBooks: string[];
  dislikedBooks: string[];
  manualBooks: { title: string; author?: string }[];
};

// Runs once, right after a new (non-Juz) user's first onboarding submit.
// Saves their profile, inserts any manually-added books, then auto-seeds a
// starter shelf per canonical genre they picked (same idea as the "More
// suggestions" button, just run automatically instead of waiting for a
// click). Free-text "Other" genres are saved to the profile but skipped for
// auto-seeding — there's no prompt scaffolding for an arbitrary genre
// string, so they only work for manually-added books.
// Returns { error } on failure. Deliberately does NOT throw for expected
// failure modes — Next.js's redirect() (called at the end, on success)
// throws a special error internally, and if the client awaited this inside
// a try/catch, it would incorrectly intercept that redirect. Returning an
// error object instead lets the client just check the result, no
// try/catch needed. See: node_modules/next/dist/docs redirecting.md —
// "redirect should be called outside the try block."
export async function submitOnboarding(
  input: OnboardingInput
): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error: profileError } = await supabase.from("user_profile").upsert({
    id: user.id,
    favorite_authors: input.favoriteAuthors,
    favorite_genres: input.favoriteGenres,
    loved_books: input.lovedBooks,
    disliked_books: input.dislikedBooks,
  });
  if (profileError) return { error: profileError.message };

  const manualTitles = input.manualBooks.map((b) => b.title.trim()).filter(Boolean);

  if (manualTitles.length) {
    const rows = input.manualBooks
      .filter((b) => b.title.trim())
      .map((b) => ({
        user_id: user.id,
        media_type: "book" as const,
        title: b.title.trim(),
        creator: b.author?.trim() || null,
        genre: input.favoriteGenres[0] ?? null,
        status: "want" as const,
        meta: { source_status: "want" as const },
      }));
    const { error } = await supabase
      .from("list_items")
      .upsert(rows, { onConflict: "user_id,media_type,title,creator", ignoreDuplicates: true });
    if (error) return { error: error.message };
  }

  const seedGenres = input.favoriteGenres.filter((g) => GENRE_TAGS.includes(g));

  // each genre's failure is caught independently so one bad Anthropic call
  // doesn't block the others or the profile/manual-book save above — gaps
  // can be filled afterward via the normal "More suggestions" button
  await Promise.allSettled(
    seedGenres.map(async (genre) => {
      const suggestions = await suggestBooks({
        genre,
        authorsOnShelf: input.favoriteAuthors,
        likedTitles: input.lovedBooks,
        dislikedTitles: input.dislikedBooks,
        avoidTitles: manualTitles,
      });

      const rows = suggestions
        .filter((s) => s.title && s.author)
        .map((s) => ({
          user_id: user.id,
          media_type: "book" as const,
          title: s.title,
          creator: s.author,
          genre,
          status: "want" as const,
          meta: { hook: s.hook ?? "", source_status: "discover" as const },
        }));

      if (rows.length) {
        await supabase
          .from("list_items")
          .upsert(rows, { onConflict: "user_id,media_type,title,creator", ignoreDuplicates: true });
      }
    })
  );

  redirect("/books");
}
