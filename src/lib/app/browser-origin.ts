/**
 * Canonical origin for Supabase `emailRedirectTo` and other auth redirects.
 *
 * Prefer `NEXT_PUBLIC_APP_URL` so it matches **Supabase Dashboard → Auth → Redirect URLs**
 * (e.g. `http://localhost:3000/auth/callback` in dev). If we used `window.location.origin`,
 * opening the app via `127.0.0.1` would send a different origin and break allowlists.
 *
 * Falls back to the current tab only when the env var is unset.
 */
export function getBrowserOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (typeof window === "undefined") {
    return "http://localhost:3000";
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return window.location.origin;
}
