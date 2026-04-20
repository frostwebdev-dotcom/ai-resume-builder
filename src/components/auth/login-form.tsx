"use client";

import { useState } from "react";
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

function errorAlert(code: string | null) {
  if (!code) return null;
  if (code === "magic_invalid_email") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Enter your email first</AlertTitle>
        <AlertDescription>
          Type the email you want to use, then tap <strong>Continue with email</strong>.
        </AlertDescription>
      </Alert>
    );
  }
  if (code === "rate_limited") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Too many requests</AlertTitle>
        <AlertDescription>Please wait a minute before trying again.</AlertDescription>
      </Alert>
    );
  }
  if (code === "google_unavailable") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Google sign-in unavailable</AlertTitle>
        <AlertDescription>
          We couldn&apos;t start a Google session. Try again in a moment, or continue with your
          email below.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive">
      <AlertTitle>Could not sign in</AlertTitle>
      <AlertDescription>Something went wrong. Try again.</AlertDescription>
    </Alert>
  );
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
  const [email, setEmail] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>("none");
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);

  function callbackUrl(): string {
    return `${getBrowserOrigin()}${ROUTES.auth.callback}?next=${encodeURIComponent(nextPath)}`;
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorCode(null);

    const parsed = magicLinkSchema.safeParse({ email });
    if (!parsed.success) {
      setErrorCode("magic_invalid_email");
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
        const m = error.message.toLowerCase();
        setErrorCode(m.includes("rate") || m.includes("too many") ? "rate_limited" : "unknown");
        setPending("none");
        return;
      }

      trackClientEvent(ANALYTICS_EVENTS.MAGIC_LINK_REQUESTED);
      setMagicSentTo(parsed.data.email);
      setPending("none");
    } catch {
      setErrorCode("unknown");
      setPending("none");
    }
  }

  async function handleGoogle() {
    setErrorCode(null);
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
        setErrorCode("google_unavailable");
        setPending("none");
        return;
      }
      // On success Supabase redirects the browser to Google; no further UI work needed.
    } catch {
      setErrorCode("google_unavailable");
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
          setErrorCode(null);
        }}
      />
    );
  }

  const busy = pending !== "none";

  return (
    <div className="flex flex-col gap-5">
      {errorAlert(errorCode)}

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
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              autoFocus
            />
          </InputWithIcon>
        </Field>

        <Button
          type="submit"
          size="touch"
          disabled={busy}
          aria-busy={pending === "magic"}
          className={cn(
            "w-full gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
          )}
        >
          {pending === "magic" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending link…
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden />
              Continue with email
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        We&apos;ll email you a one-time sign-in link. New here? Your account is created
        automatically.
      </p>
    </div>
  );
}
