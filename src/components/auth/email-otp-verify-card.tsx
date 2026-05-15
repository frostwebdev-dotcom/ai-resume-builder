"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mapEmailOtpVerifyError } from "@/lib/auth/supabase-auth-errors";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { emailOtpTokenSchema } from "@/validation/auth";

/** Strips non-digits and keeps up to 6 characters (handles SMS / keyboard autofill). */
function normalizeOtpInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

type EmailOtpVerifyCardProps = {
  email: string;
  embedded?: boolean;
  onReset: () => void;
  onVerified: () => void;
  /** Sends another code (same as initial `signInWithOtp`). */
  onResend: () => Promise<void>;
  /** Parent is already sending a code (e.g. rate limit / initial send). */
  resendDisabled?: boolean;
};

/**
 * Step 2 of email passwordless: user enters the 6-digit code from email.
 * Requires the Supabase "Magic link" template to include `{{ .Token }}` so emails contain OTP.
 * @see https://supabase.com/docs/guides/auth/auth-email-passwordless#with-otp
 */
export function EmailOtpVerifyCard({
  email,
  embedded = false,
  onReset,
  onVerified,
  onResend,
  resendDisabled = false,
}: EmailOtpVerifyCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"none" | "verify" | "resend">("none");

  function applyCodeFromString(raw: string, opts?: { submitIfComplete?: boolean }) {
    const next = normalizeOtpInput(raw);
    setCode(next);
    if (opts?.submitIfComplete && next.length === 6 && formRef.current) {
      queueMicrotask(() => formRef.current?.requestSubmit());
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = emailOtpTokenSchema.safeParse({ token: normalizeOtpInput(code) });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.token?.[0] ?? "Invalid code.");
      return;
    }

    setPending("verify");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: parsed.data.token,
        type: "email",
      });

      if (verifyError) {
        const msg = verifyError.message.toLowerCase();
        if (msg.includes("expired") || msg.includes("invalid")) {
          setError("That code is wrong or expired. Request a new code and try again.");
        } else {
          setError(mapEmailOtpVerifyError(verifyError.message));
        }
        setPending("none");
        return;
      }

      onVerified();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setPending("none");
    }
  }

  async function handleResend() {
    setError(null);
    setPending("resend");
    await onResend();
    setPending("none");
  }

  const busy = pending !== "none";

  return (
    <div className="space-y-5 text-center">
      <span
        className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-brand ring-1 ring-brand/20"
        aria-hidden
      >
        <KeyRound className="size-7" />
      </span>
      <div className="space-y-2">
        <h2 className="text-headline text-foreground">Enter your sign-in code</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-foreground">{email}</span>. Paste from your email or
          type it here — no link required.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not verify</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="flex flex-col gap-2">
          <label htmlFor="email-otp-code" className="text-sm font-medium text-foreground">
            6-digit code
          </label>
          <Input
            id="email-otp-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => applyCodeFromString(e.currentTarget.value)}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData("text");
              applyCodeFromString(text, { submitIfComplete: true });
            }}
            onFocus={(e) => e.currentTarget.select()}
            className="h-12 text-center font-mono text-lg tracking-[0.35em] tabular-nums"
            autoFocus
            disabled={busy}
            aria-invalid={Boolean(error)}
          />
          <p className="text-xs text-muted-foreground">
            Tip: paste the whole line from your email; we keep the six digits. If a banner above
            mentions a wait, send again after the timer.
          </p>
        </div>
        <Button
          type="submit"
          size="touch"
          className="w-full gap-2"
          disabled={busy}
          aria-busy={pending === "verify"}
        >
          {pending === "verify" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {pending === "verify" ? "Verifying…" : "Verify and sign in"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="touch"
          className="w-full sm:w-auto"
          disabled={busy || resendDisabled}
          aria-busy={pending === "resend"}
          onClick={() => void handleResend()}
        >
          {pending === "resend" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Resend code
        </Button>
        <Button type="button" variant="ghost" size="touch" className="w-full sm:w-auto" onClick={onReset}>
          Use a different email
        </Button>
      </div>

      {embedded ? null : (
        <Link
          href={ROUTES.auth.login}
          className={cn(buttonVariants({ variant: "ghost", size: "touch" }), "w-full")}
        >
          Back to sign in
        </Link>
      )}
    </div>
  );
}
