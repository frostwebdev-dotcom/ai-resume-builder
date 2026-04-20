"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";

import { GoogleLogo } from "@/components/auth/google-logo";
import { MagicLinkSentCard } from "@/components/auth/magic-link-sent-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { getBrowserOrigin } from "@/lib/app/browser-origin";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { magicLinkSchema } from "@/validation/auth";

type LoginFormProps = {
  nextPath: string;
};

type PendingAction = "none" | "magic" | "google";

type RateLimit = {
  /** ms timestamp when the user can try again. */
  retryAt: number;
  /** True when we know this is Supabase's hourly/daily quota, not the ~60s cooldown. */
  hardLimit: boolean;
};

/**
 * Supabase's magic-link errors fall into two rough buckets:
 *   1. "For security purposes, you can only request this after NN seconds." — the per-email
 *      60s cooldown. Short, self-clearing.
 *   2. "email rate limit exceeded" / "over_email_send_rate_limit" — the hourly/daily project
 *      quota on the built-in email sender. Longer, configurable in the Supabase dashboard.
 *
 * We try to parse a specific "after NN seconds" hint; otherwise we guess a conservative retry
 * window and flag the error as a hard limit so the UI nudges the user to Google instead.
 */
function classifyRateLimit(rawMessage: string): RateLimit | null {
  const msg = rawMessage.toLowerCase();
  const seconds = rawMessage.match(/(\d+)\s*seconds?/i)?.[1];

  const isShortCooldown =
    msg.includes("for security purposes") ||
    msg.includes("only request this after");

  const isRateLimitMessage =
    msg.includes("rate limit") ||
    msg.includes("too many") ||
    msg.includes("over_email_send_rate_limit") ||
    isShortCooldown;

  if (!isRateLimitMessage) return null;

  if (seconds) {
    const s = Number.parseInt(seconds, 10);
    if (Number.isFinite(s) && s > 0) {
      return { retryAt: Date.now() + s * 1000, hardLimit: !isShortCooldown };
    }
  }

  return {
    retryAt: Date.now() + (isShortCooldown ? 60_000 : 5 * 60_000),
    hardLimit: !isShortCooldown,
  };
}

function useSecondsUntil(ts: number | null): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (ts === null) return;
    if (ts <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [ts]);

  if (ts === null) return 0;
  return Math.max(0, Math.ceil((ts - now) / 1000));
}

/**
 * Passwordless login: one email field, one primary button.
 *   • "Continue with email" — sends a one-time magic link via `signInWithOtp`.
 *     `shouldCreateUser` is true, so first-time users are auto-provisioned on click.
 *   • "Continue with Google" — Supabase OAuth using the browser client. The PKCE `code`
 *     lands on `/auth/callback`, which already handles `exchangeCodeForSession`.
 *
 * All sessions are written by the browser client (`document.cookie`), mirroring the
 * reliability notes from the previous password flow.
 */
export function LoginForm({ nextPath }: LoginFormProps) {
  const [emailValue, setEmailValue] = useState("");
  const [genericError, setGenericError] = useState<string | null>(null);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [pending, setPending] = useState<PendingAction>("none");
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);
  const secondsLeft = useSecondsUntil(rateLimit?.retryAt ?? null);
  // Render-time derivation — once the countdown hits 0 the banner simply disappears.
  // No state sync is needed, which keeps this compatible with `react-hooks/set-state-in-effect`.
  const activeLimit = rateLimit && secondsLeft > 0 ? rateLimit : null;

  function callbackUrl(): string {
    return `${getBrowserOrigin()}${ROUTES.auth.callback}?next=${encodeURIComponent(nextPath)}`;
  }

  function resetErrors() {
    setGenericError(null);
    setInvalidEmail(false);
    setRateLimit(null);
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();

    const parsed = magicLinkSchema.safeParse({ email: emailValue });
    if (!parsed.success) {
      setInvalidEmail(true);
      return;
    }

    setPending("magic");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data.email,
        options: {
          emailRedirectTo: callbackUrl(),
          shouldCreateUser: true,
        },
      });

      if (error) {
        const limit = classifyRateLimit(error.message);
        if (limit) {
          setRateLimit(limit);
        } else {
          setGenericError("Something went wrong sending the sign-in link. Try again.");
        }
        setPending("none");
        return;
      }

      trackClientEvent(ANALYTICS_EVENTS.MAGIC_LINK_REQUESTED);
      setMagicSentTo(parsed.data.email);
      setPending("none");
    } catch {
      setGenericError("Something went wrong. Check your connection and try again.");
      setPending("none");
    }
  }

  async function handleGoogle() {
    resetErrors();
    setPending("google");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl(),
          // Always show the Google account chooser so users can pick the right account.
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        setGenericError(
          "Couldn't start a Google session. Make sure the Google provider is enabled in your Supabase project, then try again.",
        );
        setPending("none");
        return;
      }
      // On success Supabase redirects the browser to Google; no further UI work needed.
    } catch {
      setGenericError(
        "Couldn't start a Google session. Make sure the Google provider is enabled in your Supabase project, then try again.",
      );
      setPending("none");
    }
  }

  if (magicSentTo) {
    return (
      <MagicLinkSentCard
        email={magicSentTo}
        mode="signIn"
        onReset={() => {
          setMagicSentTo(null);
          resetErrors();
        }}
      />
    );
  }

  const busy = pending !== "none";
  const emailDisabled = busy || activeLimit !== null;

  const primaryEmailLabel = activeLimit
    ? `Try again in ${secondsLeft}s`
    : pending === "magic"
      ? "Sending link…"
      : "Continue with email";

  return (
    <div className="flex flex-col gap-5">
      {invalidEmail ? (
        <Alert variant="destructive">
          <AlertTitle>Enter your email first</AlertTitle>
          <AlertDescription>
            Type the email you want to use, then tap <strong>Continue with email</strong>.
          </AlertDescription>
        </Alert>
      ) : null}

      {activeLimit ? (
        <Alert variant="destructive">
          <AlertTitle>
            {activeLimit.hardLimit
              ? "Email limit reached"
              : `Please wait ${secondsLeft} second${secondsLeft === 1 ? "" : "s"}`}
          </AlertTitle>
          <AlertDescription>
            {activeLimit.hardLimit
              ? "This project has hit its email-sending quota. Use Google above to sign in right now, or try email again in a few minutes."
              : "We just sent you a link — check your inbox. If you don't see it, you can request another in a moment. Or use Google above to skip the wait."}
          </AlertDescription>
        </Alert>
      ) : null}

      {genericError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not sign in</AlertTitle>
          <AlertDescription>{genericError}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="touch"
        disabled={busy}
        aria-busy={pending === "google"}
        onClick={handleGoogle}
        className="w-full gap-2.5 bg-background"
      >
        {pending === "google" ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Connecting to Google…
          </>
        ) : (
          <>
            <GoogleLogo className="size-4" />
            Continue with Google
          </>
        )}
      </Button>

      <div className="relative flex items-center justify-center" aria-hidden>
        <span className="h-px w-full bg-border" />
        <span className="absolute bg-card px-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          or
        </span>
      </div>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
        <Field id="login-email" label="Email" required>
          <InputWithIcon leading={<Mail />}>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={emailValue}
              onChange={(e) => setEmailValue(e.currentTarget.value)}
              required
              autoFocus
            />
          </InputWithIcon>
        </Field>

        <Button
          type="submit"
          size="touch"
          disabled={emailDisabled}
          aria-busy={pending === "magic"}
          className={cn(
            "w-full gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
          )}
        >
          {pending === "magic" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Send className="size-4" aria-hidden />
          )}
          {primaryEmailLabel}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        We&apos;ll email you a one-time sign-in link. New here? Your account is created
        automatically.
      </p>
    </div>
  );
}
