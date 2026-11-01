import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Finishes sign-in from the magic-link email, then hands off to /books,
// which does the onboarding-vs-shelf gate.
//
// Supports two link shapes:
//   1. token_hash + type  -> verifyOtp   (stateless, works cross-browser)
//   2. code               -> exchangeCodeForSession (PKCE, same-browser only)
//
// (1) is what the email template should use. (2) is kept as a fallback for
// links already in someone's inbox. The PKCE flow needs the code-verifier
// cookie set by the *same* browser that requested the link — on phones the
// email often opens in a different browser (Gmail/Outlook in-app view, etc.),
// so that cookie isn't there and the exchange fails. That failure was landing
// people back on /login with no explanation; now it says why.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/books";

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "This sign-in link couldn't be completed on this device. Open the link on the same phone and browser you requested it from, or request a fresh one below."
      )}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("That sign-in link was missing its token. Request a fresh one below.")}`
  );
}
