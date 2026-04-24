"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Send } from "lucide-react";

import { GoogleLogo } from "@/components/auth/google-logo";
import { EmailOtpVerifyCard } from "@/components/auth/email-otp-verify-card";
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
  loginSchema,
  magicLinkSchema,
  panelPasswordRegisterSchema,
  panelSignInNameSchema,
} from "@/validation/auth";

function forgotPasswordHref(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return ROUTES.auth.forgotPassword;
  return `${ROUTES.auth.forgotPassword}?email=${encodeURIComponent(trimmed)}`;
}

type LoginFormProps = {
  nextPath: string;
  /** Slide-in panel layout (guest `/app`); default matches `/login` page. */
  variant?: "default" | "panel";
  /** Called when panel sign-up completes with a session (e.g. close the sheet). */
  onPanelAuthSuccess?: () => void;
};

type PendingAction = "none" | "magic" | "google" | "signup" | "signin";

type PanelStep = "email" | "name" | "password";

/** Panel only: name/password signup after user explicitly chooses password registration. */
type PanelEmailIntent = "password_register";

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
 * Passwordless-first login: `signInWithOtp` then `verifyOtp` with a 6-digit email code (no link
 * click). `shouldCreateUser: true` on send. Returning users only skip this step while a session
 * cookie is still valid (persisted + refreshed in the browser client).
 *
 *   • **Send sign-in code** — `signInWithOtp`; user enters code in EmailOtpVerifyCard.
 *   • **Continue with Google** — OAuth; PKCE `code` on `/auth/callback`.
 *   • Optional **Sign in with password instead** — `signInWithPassword`.
 *   • Password signup still uses MagicLinkSentCard when Supabase returns no session (email
 *     confirmation link — separate template).
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
  const [signInPassword, setSignInPassword] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [genericError, setGenericError] = useState<string | null>(null);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidName, setInvalidName] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [magicCardMode, setMagicCardMode] = useState<"signIn" | "signUp">("signIn");
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [pending, setPending] = useState<PendingAction>("none");
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);
  /** After `signInWithOtp`, user enters the email OTP in-app (not magic-link click). */
  const [otpAwaitEmail, setOtpAwaitEmail] = useState<string | null>(null);
  /** Optional email+password path (passwordless remains default). */
  const [showPasswordSignIn, setShowPasswordSignIn] = useState(false);
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

  async function trySignInWithPassword(
    variant: "default" | "panel",
  ): Promise<boolean> {
    const parsed = loginSchema.safeParse({
      email: emailValue,
      password: signInPassword,
    });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setInvalidEmail(Boolean(fe.email?.length));
      setInvalidPassword(Boolean(fe.password?.length));
      return false;
    }

    setInvalidEmail(false);
    setInvalidPassword(false);
    setPending("signin");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("confirm") && msg.includes("email")) {
          setGenericError("Confirm your email from the link we sent, then try signing in again.");
        } else if (
          msg.includes("invalid") ||
          msg.includes("credentials") ||
          msg.includes("password")
        ) {
          setGenericError(
            "Wrong email or password. Try again, or use Send sign-in code for email login.",
          );
        } else {
          setGenericError(error.message || "Could not sign in. Try again.");
        }
        setPending("none");
        return false;
      }

      if (variant === "panel") {
        onPanelAuthSuccess?.();
        router.refresh();
      } else {
        router.refresh();
        router.push(nextPath);
      }
      setPending("none");
      return true;
    } catch {
      setGenericError("Something went wrong. Check your connection and try again.");
      setPending("none");
      return false;
    }
  }

  async function sendEmailOtpForSignIn(
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
          setGenericError("Something went wrong sending the sign-in code. Try again.");
        }
        setPending("none");
        return;
      }

      trackClientEvent(ANALYTICS_EVENTS.MAGIC_LINK_REQUESTED);
      setOtpAwaitEmail(email);
      setPending("none");
    } catch {
      setGenericError("Something went wrong. Check your connection and try again.");
      setPending("none");
    }
  }

  async function handleDefaultSignInSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();
    await trySignInWithPassword("default");
  }

  async function handleDefaultMagicLinkSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();

    const parsed = magicLinkSchema.safeParse({ email: emailValue });
    if (!parsed.success) {
      setInvalidEmail(true);
      return;
    }

    setInvalidEmail(false);
    await sendEmailOtpForSignIn(parsed.data.email);
  }

  async function handlePanelMagicLinkSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();

    const parsed = magicLinkSchema.safeParse({ email: emailValue });
    if (!parsed.success) {
      setInvalidEmail(true);
      return;
    }

    setInvalidEmail(false);
    await sendEmailOtpForSignIn(parsed.data.email);
  }

  async function handlePanelSignInSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetErrors();
    await trySignInWithPassword("panel");
  }

  function handlePanelPasswordRegisterClick() {
    resetErrors();
    const parsed = magicLinkSchema.safeParse({ email: emailValue });
    if (!parsed.success) {
      setInvalidEmail(true);
      return;
    }
    setInvalidEmail(false);
    setInvalidName(false);
    setSignInPassword("");
    setShowPasswordSignIn(false);
    setPanelEmailIntent("password_register");
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
            "That email already has an account. Use Send sign-in code, or continue with Google.",
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
          setOtpAwaitEmail(null);
          setPanelStep("email");
          setPanelEmailIntent(null);
          setGivenName("");
          setFamilyName("");
          setPasswordValue("");
          setConfirmPasswordValue("");
          setSignInPassword("");
          setShowPasswordSignIn(false);
          resetErrors();
        }}
      />
    );
  }

  const busy = pending !== "none";
  const signInPending = pending === "signin";
  const passwordSignInSubmitDisabled =
    pending === "google" ||
    pending === "magic" ||
    pending === "signup" ||
    signInPending;
  const magicSubmitDisabled =
    pending === "google" ||
    pending === "magic" ||
    pending === "signup" ||
    pending === "signin" ||
    activeLimit !== null;

  const primaryEmailAuthLabel =
    activeLimit !== null
      ? `Try again in ${secondsLeft}s`
      : pending === "magic"
        ? isPanel
          ? "Sending…"
          : "Sending code…"
        : "Send sign-in code";

  const showInvalidEmailAlert =
    invalidEmail && (!isPanel || panelStep === "email");

  const alerts = (
    <>
      {showInvalidEmailAlert ? (
        <Alert variant="destructive">
          <AlertTitle>Check your email</AlertTitle>
          <AlertDescription>
            Enter a valid email, then tap <strong>Send sign-in code</strong>.
          </AlertDescription>
        </Alert>
      ) : null}

      {!isPanel && showPasswordSignIn && invalidPassword ? (
        <Alert variant="destructive">
          <AlertTitle>Check your password</AlertTitle>
          <AlertDescription>Use at least 8 characters.</AlertDescription>
        </Alert>
      ) : null}

      {isPanel && panelStep === "email" && showPasswordSignIn && invalidPassword ? (
        <Alert variant="destructive">
          <AlertTitle>Check your password</AlertTitle>
          <AlertDescription>Use at least 8 characters.</AlertDescription>
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
                ? "This project has hit its email-sending quota. Use Google below to sign in now, or try sending a code again in a few minutes. If you use a password, expand Sign in with password instead below."
                : "This project has hit its email-sending quota. Use Google above to sign in now, or try sending a code again in a few minutes. If you use a password, expand Sign in with password instead below."
              : isPanel
                ? "We just sent you a code — check your inbox. You can request another in a moment, or use Google below."
                : "We just sent you a code — check your inbox. You can request another in a moment, or use Google above."}
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

  if (otpAwaitEmail !== null) {
    const otpResendDisabled =
      pending === "magic" ||
      pending === "google" ||
      pending === "signup" ||
      activeLimit !== null;

    return (
      <div className={cn("flex flex-col gap-5", isPanel && "gap-6")}>
        {alerts}
        <EmailOtpVerifyCard
          email={otpAwaitEmail}
          embedded={isPanel}
          resendDisabled={otpResendDisabled}
          onResend={() => sendEmailOtpForSignIn(otpAwaitEmail)}
          onReset={() => {
            setOtpAwaitEmail(null);
            setPanelStep("email");
            setPanelEmailIntent(null);
            setSignInPassword("");
            setShowPasswordSignIn(false);
            resetErrors();
          }}
          onVerified={() => {
            setOtpAwaitEmail(null);
            if (isPanel) {
              onPanelAuthSuccess?.();
              router.refresh();
            } else {
              router.refresh();
              router.push(nextPath);
            }
          }}
        />
      </div>
    );
  }

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
    const nameStepDisabled = activeLimit !== null;

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
              setShowPasswordSignIn(false);
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
                className="h-11 min-w-[5.5rem] rounded-full bg-[#0a84ff] px-8 text-sm font-semibold text-white shadow-none hover:bg-[#0077ed] disabled:opacity-60"
              >
                Next
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isPanel) {
    const outlineButtonsDisabled =
      pending === "google" ||
      pending === "magic" ||
      pending === "signin" ||
      pending === "signup";

    return (
      <div className="flex flex-col gap-8">
        {alerts}

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            What is your email address?
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Passwordless sign-in: we&apos;ll email you a 6-digit code. Enter it here — no link click
            and no password.
          </p>
          <form
            ref={formRef}
            id="app-panel-login-email"
            onSubmit={handlePanelMagicLinkSubmit}
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
                disabled={magicSubmitDisabled}
                aria-busy={pending === "magic"}
                className="h-11 min-w-[5.5rem] rounded-full bg-[#0a84ff] px-8 text-sm font-semibold text-white shadow-none hover:bg-[#0077ed] disabled:opacity-60"
              >
                {pending === "magic" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Sending…
                  </>
                ) : (
                  primaryEmailAuthLabel
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-zinc-200 pt-5 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                setShowPasswordSignIn((open) => {
                  if (open) {
                    setSignInPassword("");
                    setInvalidPassword(false);
                  }
                  return !open;
                });
              }}
              className="text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              {showPasswordSignIn
                ? "Hide password sign-in"
                : "Sign in with password instead"}
            </button>

            {showPasswordSignIn ? (
              <form
                onSubmit={handlePanelSignInSubmit}
                className="mt-4 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="login-panel-signin-password"
                    className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
                  >
                    Password
                  </label>
                  <Input
                    id="login-panel-signin-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.currentTarget.value)}
                    className="h-12 rounded-md border-sky-200 bg-white px-3.5 text-base text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-300/35 dark:border-sky-800 dark:bg-zinc-950 dark:text-zinc-50"
                  />
                </div>
                <div className="flex justify-end">
                  <Link
                    href={forgotPasswordHref(emailValue)}
                    className="text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  disabled={passwordSignInSubmitDisabled}
                  aria-busy={signInPending}
                  className="h-11 w-full rounded-full bg-[#0a84ff] px-8 text-sm font-semibold text-white shadow-none hover:bg-[#0077ed] disabled:opacity-60"
                >
                  {signInPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            ) : null}
          </div>
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
            disabled={outlineButtonsDisabled}
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
            disabled={outlineButtonsDisabled}
            onClick={handlePanelPasswordRegisterClick}
            className={panelOutlineButton}
          >
            Create account with password
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

      <form onSubmit={handleDefaultMagicLinkSubmit} className="flex flex-col gap-4">
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
          disabled={magicSubmitDisabled}
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
          {primaryEmailAuthLabel}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        We&apos;ll email you a one-time 6-digit code. New here? Your account is created when you
        verify the code. Stay signed in on this device to skip email on return visits.
      </p>

      <div className="border-t border-border pt-5">
        <button
          type="button"
          onClick={() => {
            setShowPasswordSignIn((open) => {
              if (open) {
                setSignInPassword("");
                setInvalidPassword(false);
              }
              return !open;
            });
          }}
          className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
        >
          {showPasswordSignIn
            ? "Hide password sign-in"
            : "Sign in with password instead"}
        </button>

        {showPasswordSignIn ? (
          <form
            onSubmit={handleDefaultSignInSubmit}
            className="mt-4 flex flex-col gap-4"
          >
            <Field id="login-password" label="Password" required>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.currentTarget.value)}
                required
                className="h-11"
              />
            </Field>

            <div className="flex justify-end">
              <Link
                href={forgotPasswordHref(emailValue)}
                className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              size="touch"
              disabled={passwordSignInSubmitDisabled}
              aria-busy={signInPending}
              className={cn(
                "w-full gap-2 bg-background text-foreground shadow-sm ring-1 ring-border hover:bg-muted/60",
              )}
            >
              {signInPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {signInPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
