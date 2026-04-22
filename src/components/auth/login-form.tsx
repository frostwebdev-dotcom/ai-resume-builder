"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  magicLinkSchema,
  panelPasswordRegisterSchema,
  panelSignInNameSchema,
} from "@/validation/auth";

type LoginFormProps = {
  nextPath: string;
  /** Slide-in panel layout (guest `/app`); default matches `/login` page. */
  variant?: "default" | "panel";
  /** Called when panel sign-up completes with a session (e.g. close the sheet). */
  onPanelAuthSuccess?: () => void;
};

type PendingAction = "none" | "magic" | "google" | "signup";

type PanelStep = "email" | "name" | "password";

type PanelEmailIntent = "password_register" | "magic_link";

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
 * Passwordless login: one email field, one primary button (full-page variant).
 *   • "Continue with email" — sends a one-time magic link via `signInWithOtp`.
 *     `shouldCreateUser` is true, so first-time users are auto-provisioned on click.
 *   • Panel variant (`/app` sheet): email → name → password + `signUp` (Next from email), or
 *     email → name → magic link (“Get a one-time login code”). `options.data` carries names.
 *   • "Continue with Google" — Supabase OAuth using the browser client. The PKCE `code`
 *     lands on `/auth/callback`, which already handles `exchangeCodeForSession`.
 *
 * All sessions are written by the browser client (`document.cookie`), mirroring the
 * reliability notes from the previous password flow.
 */
export function LoginForm({
  nextPath,
  variant = "default",
  onPanelAuthSuccess,
}: LoginFormProps) {
  const isPanel = variant === "panel";
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [panelStep, setPanelStep] = useState<PanelStep>("email");
  const [panelEmailIntent, setPanelEmailIntent] = useState<PanelEmailIntent | null>(
    null,
  );
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [genericError, setGenericError] = useState<string | null>(null);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidName, setInvalidName] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [magicCardMode, setMagicCardMode] = useState<"signIn" | "signUp">("signIn");
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
    setInvalidPassword(false);
    setRateLimit(null);
  }

  async function sendMagicLink(
    email: string,
    metadata?: Record<string, string>,
  ): Promise<void> {
    setPending("magic");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl(),
          shouldCreateUser: true,
          ...(metadata ? { data: metadata } : {}),
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
      setMagicCardMode("signIn");
      setMagicSentTo(email);
      setPending("none");
    } catch {
      setGenericError("Something went wrong. Check your connection and try again.");
      setPending("none");
    }
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();

    const parsed = magicLinkSchema.safeParse({ email: emailValue });
    if (!parsed.success) {
      setInvalidEmail(true);
      return;
    }

    await sendMagicLink(parsed.data.email);
  }

  function handlePanelEmailNext(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();

    const parsed = magicLinkSchema.safeParse({ email: emailValue });
    if (!parsed.success) {
      setInvalidEmail(true);
      return;
    }

    setInvalidEmail(false);
    setInvalidName(false);
    setPanelEmailIntent("password_register");
    setPanelStep("name");
  }

  function handlePanelStartOtpPath() {
    resetErrors();
    const parsed = magicLinkSchema.safeParse({ email: emailValue });
    if (!parsed.success) {
      setInvalidEmail(true);
      return;
    }
    setInvalidEmail(false);
    setInvalidName(false);
    setPanelEmailIntent("magic_link");
    setPanelStep("name");
  }

  async function handlePanelNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();

    const parsedEmail = magicLinkSchema.safeParse({ email: emailValue });
    if (!parsedEmail.success) {
      setInvalidEmail(true);
      setPanelStep("email");
      return;
    }

    const parsedName = panelSignInNameSchema.safeParse({ givenName, familyName });
    if (!parsedName.success) {
      setInvalidName(true);
      return;
    }

    setInvalidName(false);

    if (panelEmailIntent === "magic_link") {
      const display = `${parsedName.data.givenName} ${parsedName.data.familyName}`.trim();
      await sendMagicLink(parsedEmail.data.email, {
        given_name: parsedName.data.givenName,
        family_name: parsedName.data.familyName,
        full_name: display,
        display_name: display,
      });
      return;
    }

    if (panelEmailIntent === "password_register") {
      setPanelStep("password");
      return;
    }

    setGenericError("Something went wrong. Go back and choose how you want to continue.");
    setPanelStep("email");
  }

  async function handlePanelPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();

    const parsedEmail = magicLinkSchema.safeParse({ email: emailValue });
    if (!parsedEmail.success) {
      setInvalidEmail(true);
      setPanelStep("email");
      return;
    }

    const parsedName = panelSignInNameSchema.safeParse({ givenName, familyName });
    if (!parsedName.success) {
      setInvalidName(true);
      setPanelStep("name");
      return;
    }

    const parsedPw = panelPasswordRegisterSchema.safeParse({
      password: passwordValue,
      confirmPassword: confirmPasswordValue,
    });
    if (!parsedPw.success) {
      setInvalidPassword(true);
      return;
    }

    setInvalidPassword(false);
    const display = `${parsedName.data.givenName} ${parsedName.data.familyName}`.trim();

    setPending("signup");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: parsedEmail.data.email,
        password: parsedPw.data.password,
        options: {
          emailRedirectTo: callbackUrl(),
          data: {
            given_name: parsedName.data.givenName,
            family_name: parsedName.data.familyName,
            full_name: display,
            display_name: display,
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("already") ||
          msg.includes("registered") ||
          msg.includes("exists")
        ) {
          setGenericError(
            "That email already has an account. Sign in with Google, or use “Get a one-time login code” after entering your email.",
          );
        } else {
          setGenericError(error.message || "Could not create your account. Try again.");
        }
        setPending("none");
        return;
      }

      if (data.session) {
        onPanelAuthSuccess?.();
        router.refresh();
        setPending("none");
        return;
      }

      setMagicCardMode("signUp");
      setMagicSentTo(parsedEmail.data.email);
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
        mode={magicCardMode}
        embedded={isPanel}
        onReset={() => {
          setMagicSentTo(null);
          setMagicCardMode("signIn");
          setPanelStep("email");
          setPanelEmailIntent(null);
          setGivenName("");
          setFamilyName("");
          setPasswordValue("");
          setConfirmPasswordValue("");
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
      ? isPanel
        ? "Sending…"
        : "Sending link…"
      : isPanel
        ? "Next"
        : "Continue with email";

  const primaryNameStepLabel = activeLimit
    ? `Try again in ${secondsLeft}s`
    : pending === "magic"
      ? "Sending…"
      : "Next";

  const showInvalidEmailAlert =
    invalidEmail && (!isPanel || panelStep === "email");

  const alerts = (
    <>
      {showInvalidEmailAlert ? (
        <Alert variant="destructive">
          <AlertTitle>Enter your email first</AlertTitle>
          <AlertDescription>
            {isPanel ? (
              <>
                Type the email you want to use, then tap <strong>Next</strong>.
              </>
            ) : (
              <>
                Type the email you want to use, then tap{" "}
                <strong>Continue with email</strong>.
              </>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      {isPanel && panelStep === "name" && invalidName ? (
        <Alert variant="destructive">
          <AlertTitle>Add your name</AlertTitle>
          <AlertDescription>
            Enter both <strong>first name</strong> and <strong>last name</strong> to continue.
          </AlertDescription>
        </Alert>
      ) : null}

      {isPanel && panelStep === "password" && invalidPassword ? (
        <Alert variant="destructive">
          <AlertTitle>Check your password</AlertTitle>
          <AlertDescription>
            Use at least 8 characters and make sure both fields match.
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
              ? isPanel
                ? "This project has hit its email-sending quota. Use Google below to sign in now, or try email again in a few minutes."
                : "This project has hit its email-sending quota. Use Google above to sign in right now, or try email again in a few minutes."
              : isPanel
                ? "We just sent you a link — check your inbox. You can request another in a moment, or use Google below to skip the wait."
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
    </>
  );

  const panelOutlineButton =
    "h-12 w-full rounded-full border border-zinc-200 bg-white text-[15px] font-medium text-zinc-900 shadow-none hover:bg-zinc-50";

  const panelPasswordInputClass =
    "h-12 rounded-md border-zinc-200/90 bg-zinc-100 px-3.5 text-base text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-300/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  if (isPanel && panelStep === "password") {
    const passwordStepDisabled = pending === "signup";

    return (
      <div className="flex flex-col gap-8">
        {alerts}

        <div>
          <button
            type="button"
            onClick={() => {
              setPanelStep("name");
              setInvalidPassword(false);
              resetErrors();
            }}
            className="text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Back
          </button>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create a password
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            At least 8 characters. You&apos;ll use this with your email to sign in.
          </p>
          <form onSubmit={handlePanelPasswordSubmit} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-panel-password"
                className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                Password
              </label>
              <Input
                id="login-panel-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.currentTarget.value)}
                className={panelPasswordInputClass}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-panel-confirm-password"
                className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                Confirm password
              </label>
              <Input
                id="login-panel-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPasswordValue}
                onChange={(e) => setConfirmPasswordValue(e.currentTarget.value)}
                className={panelPasswordInputClass}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={passwordStepDisabled}
                aria-busy={pending === "signup"}
                className="h-11 min-w-[5.5rem] rounded-full bg-[#0a84ff] px-8 text-sm font-semibold text-white shadow-none hover:bg-[#0077ed] disabled:opacity-60"
              >
                {pending === "signup" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isPanel && panelStep === "name") {
    const isOtpPath = panelEmailIntent === "magic_link";
    const nameStepDisabled = activeLimit !== null || (isOtpPath && pending === "magic");
    const namePrimaryLabel = isOtpPath ? primaryNameStepLabel : "Next";

    return (
      <div className="flex flex-col gap-8">
        {alerts}

        <div>
          <button
            type="button"
            onClick={() => {
              setPanelStep("email");
              setPanelEmailIntent(null);
              setInvalidName(false);
              resetErrors();
            }}
            className="text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Change email
          </button>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            What is your name?
          </h2>
          <form onSubmit={handlePanelNameSubmit} className="mt-6 flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="login-given-name"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  First name
                </label>
                <Input
                  id="login-given-name"
                  name="givenName"
                  autoComplete="given-name"
                  value={givenName}
                  onChange={(e) => setGivenName(e.currentTarget.value)}
                  className="h-12 rounded-md border-zinc-200/90 bg-zinc-100 px-3.5 text-base text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-300/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  autoFocus
                />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="login-family-name"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  Last name
                </label>
                <Input
                  id="login-family-name"
                  name="familyName"
                  autoComplete="family-name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.currentTarget.value)}
                  className="h-12 rounded-md border-zinc-200/90 bg-zinc-100 px-3.5 text-base text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-300/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={nameStepDisabled}
                aria-busy={isOtpPath && pending === "magic"}
                className="h-11 min-w-[5.5rem] rounded-full bg-[#0a84ff] px-8 text-sm font-semibold text-white shadow-none hover:bg-[#0077ed] disabled:opacity-60"
              >
                {isOtpPath && pending === "magic" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  namePrimaryLabel
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isPanel) {
    const emailStepBusy = pending === "google";
    const emailStepDisabled = emailStepBusy || activeLimit !== null;

    return (
      <div className="flex flex-col gap-8">
        {alerts}

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            What is your email address?
          </h2>
          <form
            ref={formRef}
            id="app-panel-login-email"
            onSubmit={handlePanelEmailNext}
            className="mt-6 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-email-panel"
                className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
              >
                Email address
              </label>
              <Input
                id="login-email-panel"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={emailValue}
                onChange={(e) => setEmailValue(e.currentTarget.value)}
                required
                autoFocus
                className="h-12 rounded-md border-sky-200 bg-white px-3.5 text-base text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-300/35 dark:border-sky-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={emailStepDisabled}
                className="h-11 min-w-[5.5rem] rounded-full bg-[#0a84ff] px-8 text-sm font-semibold text-white shadow-none hover:bg-[#0077ed] disabled:opacity-60"
              >
                {primaryEmailLabel}
              </Button>
            </div>
          </form>
        </div>

        <div className="relative flex items-center justify-center py-1">
          <span className="h-px w-full bg-zinc-200 dark:bg-zinc-700" />
          <span className="absolute bg-white px-4 text-sm text-zinc-400 dark:bg-zinc-950 dark:text-zinc-400">
            Or
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={emailStepBusy}
            aria-busy={pending === "google"}
            onClick={handleGoogle}
            className={cn(panelOutlineButton, "gap-2.5")}
          >
            {pending === "google" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Connecting to Google…
              </>
            ) : (
              <>
                <GoogleLogo className="size-[18px]" />
                Continue with Google
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={emailStepDisabled}
            onClick={handlePanelStartOtpPath}
            className={panelOutlineButton}
          >
            Get a one-time login code
          </Button>
        </div>

        <p className="text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          By continuing, you accept our{" "}
          <Link
            href={ROUTES.terms}
            className="underline decoration-zinc-400 underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            terms
          </Link>{" "}
          and{" "}
          <Link
            href={ROUTES.privacy}
            className="underline decoration-zinc-400 underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            privacy policy
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {alerts}

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
