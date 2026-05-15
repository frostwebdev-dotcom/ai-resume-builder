import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { emailConfirmationHandoffResponse } from "@/lib/auth/email-confirm-handoff";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import { ROUTES } from "@/lib/constants";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { trySendWelcomeEmail } from "@/services/email/welcome";

function maybeTrackSignupCompletedFromUser(user: { created_at?: string } | null): void {
  if (!user?.created_at) return;
  const createdMs = new Date(user.created_at).getTime();
  if (!Number.isFinite(createdMs)) return;
  if (Date.now() - createdMs > 10 * 60 * 1000) return;
  trackServerEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED, { channel: "auth_callback" });
}

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
  // `next` is a same-origin path, optionally with query (e.g. `/create?signedIn=1` after guest sign-in).
  const next = sanitizeNextPath(nextRaw);
  const redirectTo = new URL(next, request.url);

  console.log(`[auth/callback] code=${code ? "yes" : "no"} token_hash=${url.searchParams.get("token_hash") ? "yes" : "no"} type=${url.searchParams.get("type")} error=${url.searchParams.get("error")} next=${next}`);

  if (code) {
    const handoffResponse = emailConfirmationHandoffResponse(redirectTo);
    const { supabase, getResponse } = createSupabaseMiddlewareClient(
      request,
      handoffResponse,
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    console.log(`[auth/callback] exchangeCodeForSession: ${error ? `ERROR: ${error.message}` : "ok"}`);

    if (error) {
      const loginUrl = new URL(ROUTES.auth.login, request.url);
      loginUrl.searchParams.set("error", "auth");
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    maybeTrackSignupCompletedFromUser(user);
    if (user?.email) {
      void trySendWelcomeEmail(user.id, user.email).catch((e) =>
        console.error("[auth/callback] welcome email", e),
      );
    }

    return getResponse();
  }

  const tokenHash = url.searchParams.get("token_hash");
  const otpType = parseEmailOtpType(url.searchParams.get("type"));
  if (tokenHash && otpType) {
    const handoffResponse = emailConfirmationHandoffResponse(redirectTo);
    const { supabase, getResponse } = createSupabaseMiddlewareClient(
      request,
      handoffResponse,
    );
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });

    console.log(`[auth/callback] verifyOtp: ${error ? `ERROR: ${error.message}` : "ok"}`);

    if (error) {
      const loginUrl = new URL(ROUTES.auth.login, request.url);
      loginUrl.searchParams.set("error", "auth");
      loginUrl.searchParams.set("next", next);
      return NextResponse.redirect(loginUrl);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    maybeTrackSignupCompletedFromUser(user);
    if (user?.email) {
      void trySendWelcomeEmail(user.id, user.email).catch((e) =>
        console.error("[auth/callback] welcome email", e),
      );
    }

    return getResponse();
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
