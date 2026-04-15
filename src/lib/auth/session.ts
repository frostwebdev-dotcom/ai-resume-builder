import "server-only";

import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export type AuthContext = {
  user: User;
  profile: Profile;
};

function hasSupabaseClientConfig(): boolean {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url?.trim() && key?.trim());
}

/**
 * Current session user, or null if not signed in.
 */
export async function getSessionUser(): Promise<User | null> {
  if (!hasSupabaseClientConfig()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Profile row for the current user, or null if not signed in / missing row.
 */
export async function getSessionProfile(): Promise<Profile | null> {
  if (!hasSupabaseClientConfig()) {
    return null;
  }

  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * User + profile for authenticated layouts (single round-trip where possible).
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  if (!hasSupabaseClientConfig()) {
    return null;
  }

  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) return null;
  return { user, profile };
}
