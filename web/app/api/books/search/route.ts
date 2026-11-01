import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchBooks } from "@/lib/books/searchBooks";

// Type-ahead source for the Add-a-book modal's Title field. Runs on the
// server (Google Books, falling back to Open Library) and is auth-gated
// like the other API routes.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ results: [], failed: false });

  return NextResponse.json(await searchBooks(q));
}
