import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Implicit flow, not the default PKCE. PKCE needs a code-verifier
      // stored in the same browser that requested the link — on phones the
      // email opens in a different in-app browser, so the verifier is
      // missing and sign-in bounces back to /login. Implicit flow returns
      // the session in the URL hash and needs no stored verifier, so it
      // works cross-browser. The trade-off (no editable email template
      // needed) matters here because this project uses Supabase's built-in
      // email service, which locks templates unless you add custom SMTP.
      // The magic link lands on /auth/confirm, which reads the hash.
      auth: { flowType: "implicit" },
    }
  );
}
