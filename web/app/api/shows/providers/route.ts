import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuProviders } from "@/lib/shows/searchShows";

// Where a picked show streams in Australia (TMDB watch providers, data from
// JustWatch). Only used to pre-fill the Add-a-show form's Streaming service
// field; the user can always change it. Auth-gated like the other routes.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const id = Number(params.get("id"));
  const type = params.get("type");
  if (!Number.isInteger(id) || (type !== "movie" && type !== "tv")) {
    return NextResponse.json({ providers: [] });
  }
  return NextResponse.json({ providers: await getAuProviders(id, type) });
}
