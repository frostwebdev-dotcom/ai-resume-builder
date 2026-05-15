"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

import { sanitizeNextPath } from "@/lib/auth/redirect";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase/client";

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

function loginWithAuthError(
  router: ReturnType<typeof useRouter>,
  requestUrl: string,
  next: string,
  kind: "auth" | "link_expired",
): void {
  const loginUrl = new URL(ROUTES.auth.login, requestUrl);
  loginUrl.searchParams.set("error", kind === "link_expired" ? "link_expired" : "auth");
  loginUrl.searchParams.set("next", next);
  router.replace(`${loginUrl.pathname}${loginUrl.search}`);
}

function navigateAfterSession(
  router: ReturnType<typeof useRouter>,
  nextPath: string,
  requestUrl: string,
): void {
  const safeNext = sanitizeNextPath(nextPath);
  const dest = new URL(safeNext, requestUrl).toString();

  try {
    if (typeof window !== "undefined" && window.top != null && window.top !== window.self) {
      const w = window.open(dest, "_blank", "noopener,noreferrer");
      if (!w) window.top.location.href = dest;
      return;
    }
  } catch {
    try {
      window.open(dest, "_blank", "noopener,noreferrer");
      return;
    } catch {
      /* fall through */
    }
  }

  void router.refresh();
  router.replace(safeNext);
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ranRef = useRef(false);
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!hasSupabaseBrowserConfig()) {
      loginWithAuthError(router, window.location.href, ROUTES.app.root, "auth");
      return;
    }

    const requestUrl = window.location.href;
    const nextRaw = searchParams.get("next");
    const next = sanitizeNextPath(nextRaw);

    const errorCode = searchParams.get("error_code");
    const err = searchParams.get("error");
    if (errorCode === "otp_expired" || err === "access_denied") {
      loginWithAuthError(router, requestUrl, next, "link_expired");
      return;
    }
    if (err) {
      loginWithAuthError(router, requestUrl, next, "auth");
      return;
    }

    void (async () => {
      const supabase = createSupabaseBrowserClient();

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash") ?? searchParams.get("token");
      const otpType = parseEmailOtpType(searchParams.get("type"));

      try {
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            const { data: sess } = await supabase.auth.getSession();
            if (!sess.session) {
              console.error("[auth/callback] exchangeCodeForSession", exErr.message);
              loginWithAuthError(router, requestUrl, next, "auth");
              return;
            }
          }
        } else if (tokenHash && otpType) {
          const { error: vErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (vErr) {
            const { data: sess } = await supabase.auth.getSession();
            if (!sess.session) {
              console.error("[auth/callback] verifyOtp", vErr.message);
              loginWithAuthError(router, requestUrl, next, "auth");
              return;
            }
          }
        } else if (typeof window !== "undefined" && window.location.hash?.length > 1) {
          const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const access_token = hp.get("access_token");
          const refresh_token = hp.get("refresh_token");
          if (access_token && refresh_token) {
            const { error: sErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sErr) {
              const { data: sess } = await supabase.auth.getSession();
              if (!sess.session) {
                console.error("[auth/callback] setSession", sErr.message);
                loginWithAuthError(router, requestUrl, next, "auth");
                return;
              }
            }
          } else {
            loginWithAuthError(router, requestUrl, next, "auth");
            return;
          }
        } else {
          const { data: existing } = await supabase.auth.getSession();
          if (!existing.session) {
            loginWithAuthError(router, requestUrl, next, "auth");
            return;
          }
        }

        setMessage("Almost there…");
        await fetch("/api/auth/post-callback", { method: "POST", credentials: "same-origin" }).catch(
          (e) => console.error("[auth/callback] post-callback", e),
        );

        navigateAfterSession(router, next, requestUrl);
      } catch (e) {
        console.error("[auth/callback]", e);
        loginWithAuthError(router, requestUrl, next, "auth");
      }
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function AuthCallbackClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
