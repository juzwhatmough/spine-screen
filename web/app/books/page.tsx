import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupItems } from "@/lib/books/groupItems";
import { seedJuzLibrary } from "@/lib/actions/seedJuz";
import { BooksShelvesView } from "@/components/books/BooksShelvesView";
import { TabNav } from "@/components/nav/TabNav";
import type { ListItemRow } from "@/types/database";

export default async function BooksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const query = () =>
    supabase
      .from("list_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("media_type", "book")
      .order("created_at", { ascending: true });

  const { data: initialItems, error } = await query();
  if (error) throw new Error(error.message);

  const isJuz = !!process.env.JUZ_EMAIL && user.email === process.env.JUZ_EMAIL;
  let items = initialItems;

  if ((items ?? []).length === 0) {
    if (isJuz) {
      // Silent one-time seed — no onboarding UI for her, see lib/actions/seedJuz.ts
      await seedJuzLibrary();
      const refetch = await query();
      if (refetch.error) throw new Error(refetch.error.message);
      items = refetch.data;
    } else {
      redirect("/onboarding");
    }
  }

  const rows = (items ?? []) as ListItemRow[];
  const shelves = groupItems(rows);

  return (
    <>
      <header>
        <div className="spine-strip" />
        <p className="eyebrow">Personal library · Est. Aug 2026</p>
        <h1>
          The <em>Shelf</em>
        </h1>
        <p className="sub">
          Your favourite authors, more of their own work, and the writers
          you might fall for next — sorted the way a good bookshop shelves
          them, by genre rather than app.
        </p>
        <TabNav active="books" />
      </header>

      <BooksShelvesView shelves={shelves} />

      <footer>
        Tap a card to mark it read, then 👍 or 👎 it · Tap &quot;Suggest
        more&quot; on any shelf for fresh picks based on your ratings ·
        Your list is saved to your account
      </footer>
    </>
  );
}
