import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupItems } from "@/lib/books/groupItems";
import { seedJuzLibrary } from "@/lib/actions/seedJuz";
import { BooksShelvesView } from "@/components/books/BooksShelvesView";
import { TabNav } from "@/components/nav/TabNav";
import { MarqueeLights } from "@/components/ui/MarqueeLights";
import type { StatusView } from "@/lib/hooks/useStatusTransitions";
import type { ListItemRow } from "@/types/database";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const initialView: StatusView = view === "finished" ? "finished" : "shelf";

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
      <MarqueeLights />
      <header className="mq-shelf-header">
        <h1 className="mq-title">The Shelf</h1>
      </header>
      <TabNav active="books" />

      <BooksShelvesView shelves={shelves} userEmail={user.email ?? ""} initialView={initialView} />
    </>
  );
}
