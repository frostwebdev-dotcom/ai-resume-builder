import { AuthCallbackClient } from "@/app/auth/callback/auth-callback-client";

export const dynamic = "force-dynamic";

/**
 * Email magic links, OAuth (PKCE), and legacy implicit redirects land here.
 * Implemented as a Client page so tokens in the **URL hash** (not sent to Route Handlers) still work.
 *
 * Add `${NEXT_PUBLIC_APP_URL}/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export default function AuthCallbackPage() {
  return <AuthCallbackClient />;
}
