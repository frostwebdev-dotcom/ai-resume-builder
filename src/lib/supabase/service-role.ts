import "server-only";

import { createClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service role client — bypasses RLS. Use only on the server for webhooks, admin jobs,
 * inserting orders/payments/downloads, and generating signed storage URLs.
 * Never import from Client Components or expose the service key.
 */
export function createSupabaseServiceRoleClient() {
  const url = serverEnv.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase service client: set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
