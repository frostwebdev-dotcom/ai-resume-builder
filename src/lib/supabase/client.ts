import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/** True when the browser bundle has both public Supabase vars (trimmed). */
export function hasSupabaseBrowserConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anonKey);
}

/**
 * Browser Supabase client for Client Components.
 * Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before use.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser client: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient<Database>(url, anonKey);
}
