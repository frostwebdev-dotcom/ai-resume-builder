import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env";
import { filterCookiesForSupabaseProject } from "@/lib/supabase/cookie-filter";
import type { Database } from "@/types/database";

/**
 * Server Supabase client (Server Components, Route Handlers, Server Actions).
 * Uses the anon key and the user's cookies for session scope.
 */
export async function createSupabaseServerClient() {
  const url = serverEnv.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = serverEnv.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase server client: missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or anon key.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return filterCookiesForSupabaseProject(cookieStore.getAll(), url);
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component without mutable cookies; session refresh can be deferred to Middleware.
        }
      },
    },
  });
}
