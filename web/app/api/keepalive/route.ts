import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Hit once a day by the Vercel cron in vercel.json. Supabase's free plan pauses a
// project after a week with no activity, and a paused project takes a long time to
// wake on the next visit — this tiny query counts as activity and prevents that.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("list_items").select("id").limit(1);
  return NextResponse.json({ ok: !error });
}
