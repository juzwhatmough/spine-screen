import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the magic-link/OTP code for a session, then hands off to
// /books, which does the onboarding-vs-shelf gate.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/books`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
