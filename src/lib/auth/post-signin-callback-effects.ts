import "server-only";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { trySendWelcomeEmail } from "@/services/email/welcome";

function maybeTrackSignupCompletedFromUser(user: { created_at?: string } | null): void {
  if (!user?.created_at) return;
  const createdMs = new Date(user.created_at).getTime();
  if (!Number.isFinite(createdMs)) return;
  if (Date.now() - createdMs > 10 * 60 * 1000) return;
  trackServerEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED, { channel: "auth_callback" });
}

/**
 * Runs after the browser has established a Supabase session (PKCE exchange, OTP verify, or implicit hash).
 * Call from `/api/auth/post-callback` so cookies from the client exchange are visible on the server.
 */
export async function runPostSignInCallbackEffects(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return false;

  maybeTrackSignupCompletedFromUser(user);
  if (user.email) {
    void trySendWelcomeEmail(user.id, user.email).catch((e) =>
      console.error("[auth/post-callback] welcome email", e),
    );
  }
  return true;
}
