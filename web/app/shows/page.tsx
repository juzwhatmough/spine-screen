import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupShowItems } from "@/lib/shows/groupItems";
import { seedJuzShows } from "@/lib/actions/seedJuzShows";
import { ShelfNav } from "@/components/books/ShelfNav";
import { ShowShelf } from "@/components/shows/ShowShelf";
import { AddShowForm } from "@/components/shows/AddShowForm";
import { TabNav } from "@/components/nav/TabNav";
import type { ListItemRow } from "@/types/database";

// No onboarding for Shows — the original static feature never had genre
// preferences or AI suggestions either, so there's nothing to ask new
// users. They land straight here with an empty shelf and the always-visible
// "Add a show" form (see AddShowForm.tsx). Only Juz gets anything
// pre-populated, silently, same pattern as her book seed.
export default async function ShowsPage() {
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
      .eq("media_type", "show")
      .order("created_at", { ascending: true });

  const { data: initialItems, error } = await query();
  if (error) throw new Error(error.message);

  const isJuz = !!process.env.JUZ_EMAIL && user.email === process.env.JUZ_EMAIL;
  let items = initialItems;

  if (isJuz && (items ?? []).length === 0) {
    await seedJuzShows();
    const refetch = await query();
    if (refetch.error) throw new Error(refetch.error.message);
    items = refetch.data;
  }

  const rows = (items ?? []) as ListItemRow[];
  const shelves = groupShowItems(rows);
  const notStreamingCount = rows.filter((r) => r.meta?.currentlyStreaming === false).length;

  return (
    <>
      <header>
        <div className="spine-strip" />
        <p className="eyebrow">Personal library · Est. Aug 2026</p>
        <h1>
          The <em>Shelf</em>
        </h1>
        <p className="sub">
          Shows queued up across every app you pay for — sorted the way a
          good shelf would, by genre rather than platform.
        </p>
        <TabNav active="shows" />
      </header>

      <div className="stats">
        <span>
          <b>{shelves.length}</b> shelves
        </span>
        <span>
          <b>{rows.length}</b> titles
        </span>
        {notStreamingCount > 0 && (
          <span>
            <b>{notStreamingCount}</b> not currently streaming
          </span>
        )}
        <span>Tap a card to mark it watched, then rate it</span>
      </div>

      <ShelfNav shelves={shelves.map((s) => ({ id: s.id, tag: s.tag }))} />

      <main>
        <AddShowForm />
        {shelves.map((shelf) => (
          <ShowShelf key={shelf.id} shelf={shelf} />
        ))}
      </main>

      <footer>
        Tap a card to mark it watched, then 👍 or 👎 it · Add your own with
        the form above · Your list is saved to your account
      </footer>
    </>
  );
}
