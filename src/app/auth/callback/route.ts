import { NextResponse, type NextRequest } from "next/server";

import { sanitizeNextPath } from "@/lib/auth/redirect";
import { ROUTES } from "@/lib/constants";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { trySendWelcomeEmail } from "@/services/email/welcome";

/**
 * OAuth / email-confirmation / password-recovery PKCE exchange.
 * Session cookies are applied to the redirect `Response` (required in Route Handlers).
 * Add `${NEXT_PUBLIC_APP_URL}/auth/callback` to Supabase Auth → Redirect URLs.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next");
  const next = sanitizeNextPath(nextRaw);

  if (!code) {
    return NextResponse.redirect(
      new URL(`${ROUTES.auth.login}?error=auth`, request.url),
    );
  }

  const redirectTo = new URL(next, request.url);
  const response = NextResponse.redirect(redirectTo);
  const supabase = createSupabaseMiddlewareClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`${ROUTES.auth.login}?error=auth`, request.url),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    void trySendWelcomeEmail(user.id, user.email).catch((e) =>
      console.error("[auth/callback] welcome email", e),
    );
  }

  return response;
}
