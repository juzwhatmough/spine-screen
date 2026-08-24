import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupShowItems } from "@/lib/shows/groupItems";
import { seedJuzShows } from "@/lib/actions/seedJuzShows";
import { ShowsShelvesView } from "@/components/shows/ShowsShelvesView";
import { TabNav } from "@/components/nav/TabNav";
import type { ListItemRow } from "@/types/database";

// No onboarding for Shows — the original static feature never had genre
// preferences either, so there's nothing to ask new users. They land
// straight here with an empty shelf and the "Add a show" FAB (see
// AddShowFab.tsx) as their only way in. Only Juz gets anything
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

      <ShowsShelvesView shelves={shelves} />

      <footer>
        Tap a card to mark it watched, then 👍 or 👎 it · Tap the + button
        to add your own · Your list is saved to your account
      </footer>
    </>
  );
}
