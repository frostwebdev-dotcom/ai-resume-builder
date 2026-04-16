import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeNextPath } from "@/lib/auth/redirect";
import { ROUTES } from "@/lib/constants";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { trySendWelcomeEmail } from "@/services/email/welcome";

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function parseEmailOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null;
  return EMAIL_OTP_TYPES.includes(raw as EmailOtpType) ? (raw as EmailOtpType) : null;
}

/**
 * OAuth / email-confirmation / password-recovery PKCE exchange.
 * Also handles email links that use `token_hash` + `type` (no PKCE `code`), which still occurs for some Supabase flows or resent emails.
 * Session cookies are applied to the redirect `Response` (required in Route Handlers).
 * Add `${NEXT_PUBLIC_APP_URL}/auth/callback` to Supabase Auth → Redirect URLs.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next");
  const next = sanitizeNextPath(nextRaw);
  const redirectTo = new URL(next, request.url);

  if (code) {
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

  const tokenHash = url.searchParams.get("token_hash");
  const otpType = parseEmailOtpType(url.searchParams.get("type"));
  if (tokenHash && otpType) {
    const response = NextResponse.redirect(redirectTo);
    const supabase = createSupabaseMiddlewareClient(request, response);
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });

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

  const errorCode = url.searchParams.get("error_code");
  const loginUrl = new URL(ROUTES.auth.login, request.url);
  if (errorCode === "otp_expired" || url.searchParams.get("error") === "access_denied") {
    loginUrl.searchParams.set("error", "link_expired");
  } else {
    loginUrl.searchParams.set("error", "auth");
  }
  return NextResponse.redirect(loginUrl);
}
