import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// Create a fresh client per request — never share across requests/renders.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Server Components can't set cookies — this throws there and is
          // safe to ignore as long as proxy.ts is refreshing the session on
          // every navigation (it is). Server Actions/Route Handlers can set
          // cookies fine and will hit this normally.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component — ignore, proxy.ts handles refresh
          }
        },
      },
    }
  );
}
