/**
 * Supabase stores auth cookies as `sb-<project-ref>-…` (see hosted URL `https://<ref>.supabase.co`).
 * If the browser still has cookies from another project (old env / migrated project), passing *all*
 * `sb-*` cookies into `createServerClient` can break session resolution and cause `/app` ↔ `/login` loops.
 */
export function supabaseAuthCookiePrefix(supabaseUrl: string): string | null {
  try {
    const host = new URL(supabaseUrl).hostname;
    const m = host.match(/^([^.]+)\.supabase\.co$/i);
    if (!m?.[1]) return null;
    return `sb-${m[1]}-`;
  } catch {
    return null;
  }
}

export function filterCookiesForSupabaseProject<T extends { name: string; value: string }>(
  cookies: T[],
  supabaseUrl: string,
): T[] {
  const prefix = supabaseAuthCookiePrefix(supabaseUrl);
  if (!prefix) return cookies;
  return cookies.filter((c) => c.name.startsWith(prefix));
}
