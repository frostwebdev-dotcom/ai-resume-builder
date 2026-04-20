"use client";

import { useRef, useState } from "react";
// Note: `<Input>` doesn't forward a ref through the Base UI primitive in this wrapper, so we
// locate the DOM node via its stable id when we need to focus it on invalid input.
import Link from "next/link";
import { Loader2, Mail, Send } from "lucide-react";

import { MagicLinkSentCard } from "@/components/auth/magic-link-sent-card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { getBrowserOrigin } from "@/lib/app/browser-origin";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { loginSchema, magicLinkSchema } from "@/validation/auth";

type LoginFormProps = {
  nextPath: string;
};

type PendingAction = "none" | "password" | "magic";

function errorAlert(code: string | null) {
  if (!code) return null;
  if (code === "email_unconfirmed") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Confirm your email</AlertTitle>
        <AlertDescription>
          This account exists but the email address is not confirmed yet. Use the link in your inbox or
          request a new magic link below.
        </AlertDescription>
      </Alert>
    );
  }
  if (code === "credentials") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not sign in</AlertTitle>
        <AlertDescription>Invalid email or password.</AlertDescription>
      </Alert>
    );
  }
  if (code === "magic_invalid_email") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Enter your email first</AlertTitle>
        <AlertDescription>
          Type the email you sign in with, then tap <strong>Email me a sign-in link</strong> again.
        </AlertDescription>
      </Alert>
    );
  }
  if (code === "magic_rate_limited") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Too many requests</AlertTitle>
        <AlertDescription>
          Please wait a minute before requesting another sign-in link.
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
 * Signs in with the browser Supabase client so the session is stored in cookies via `document.cookie`.
 * Server routes and Server Actions are unreliable for persisting Supabase cookie chunks in some setups.
 *
 * Also offers passwordless sign-in: the user enters their email, we send a one-time magic link
 * via `signInWithOtp`, and `/auth/callback` (which already handles `magiclink` OTP type) finishes the flow.
 * `shouldCreateUser` defaults to true, so first-time users are provisioned on their first click.
 */
export function LoginForm({ nextPath }: LoginFormProps) {
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>("none");
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  function focusEmailInput() {
    if (typeof document === "undefined") return;
    const el = document.getElementById("login-email");
    if (el instanceof HTMLInputElement) el.focus();
  }

  function currentEmail(): string {
    const form = formRef.current;
    if (!form) return "";
    const raw = new FormData(form).get("email");
    return typeof raw === "string" ? raw.trim() : "";
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorCode(null);

    const formData = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setErrorCode("credentials");
      return;
    }

    setPending("password");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes("email not confirmed")) {
          setErrorCode("email_unconfirmed");
        } else {
          setErrorCode("credentials");
        }
        setPending("none");
        return;
      }

      await supabase.auth.getSession();
      window.location.href = nextPath;
    } catch {
      setErrorCode("unknown");
      setPending("none");
    }
  }

  async function handleMagicLink() {
    setErrorCode(null);

    const email = currentEmail();
    const parsed = magicLinkSchema.safeParse({ email });
    if (!parsed.success) {
      setErrorCode("magic_invalid_email");
      focusEmailInput();
      return;
    }

    setPending("magic");
    try {
      const supabase = createSupabaseBrowserClient();
      const emailRedirectTo = `${getBrowserOrigin()}${ROUTES.auth.callback}?next=${encodeURIComponent(nextPath)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data.email,
        options: {
          emailRedirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes("rate") || m.includes("too many")) {
          setErrorCode("magic_rate_limited");
        } else {
          setErrorCode("unknown");
        }
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
    <form
      ref={formRef}
      method="post"
      action="#"
      onSubmit={handlePasswordSubmit}
      className="flex flex-col gap-6"
    >
      {errorAlert(errorCode)}

      <Field id="login-email" label="Email" required>
        <InputWithIcon leading={<Mail />}>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </InputWithIcon>
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="login-password"
            className="text-label flex items-center gap-0"
          >
            Password
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          </label>
          <Link
            href={ROUTES.auth.forgotPassword}
            className="text-xs font-medium text-brand underline-offset-4 hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="flex flex-col gap-5">
        <Button
          type="submit"
          size="touch"
          disabled={busy}
          aria-busy={pending === "password"}
          className={cn(
            "w-full gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
          )}
        >
          {pending === "password" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <div className="relative flex items-center justify-center" aria-hidden>
          <span className="h-px w-full bg-border" />
          <span className="absolute bg-card px-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            or
          </span>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="touch"
            disabled={busy}
            aria-busy={pending === "magic"}
            onClick={handleMagicLink}
            className="w-full gap-2"
          >
            {pending === "magic" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Sending link…
              </>
            ) : (
              <>
                <Send className="size-4" aria-hidden />
                Email me a sign-in link
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Passwordless — we&apos;ll email you a one-time link. First time? An account is created
            automatically.
          </p>
        </div>

        <p className="min-h-11 text-center text-sm text-muted-foreground">
          New here? Just enter your email above — we&apos;ll set up your account automatically.
        </p>
      </div>
    </form>
  );
}
