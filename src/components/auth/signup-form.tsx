"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Inbox, Loader2, Mail } from "lucide-react";

import { PasswordStrength } from "@/components/auth/password-strength";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { getBrowserOrigin } from "@/lib/app/browser-origin";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { signupSchema } from "@/validation/auth";

export function SignupForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const confirmMismatch =
    confirm.length > 0 && password.length > 0 && confirm !== password;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) {
      const err = parsed.error.flatten();
      setError(
        err.fieldErrors.email?.[0] ??
        err.fieldErrors.password?.[0] ??
        err.fieldErrors.confirmPassword?.[0] ??
        "Fix the highlighted fields.",
      );
      return;
    }

    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin = getBrowserOrigin();
      const emailRedirectTo = `${origin}${ROUTES.auth.callback}?next=${encodeURIComponent(ROUTES.app.root)}`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          setError("An account with this email already exists. Try signing in.");
        } else {
          setError(signUpError.message);
        }
        setPending(false);
        return;
      }

      if (data.session) {
        await supabase.auth.getSession();
        window.location.href = ROUTES.app.root;
        return;
      }

      setSuccess(
        "Check your email for a confirmation link. After confirming, you can sign in.",
      );
      setPending(false);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <span
          className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-muted text-brand ring-1 ring-brand/20"
          aria-hidden
        >
          <Inbox className="size-7" />
        </span>
        <div className="space-y-2">
          <h2 className="text-headline text-foreground">Check your inbox</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {success}
          </p>
        </div>
        <ul className="mx-auto max-w-xs space-y-2 text-left text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden
            />
            Look for an email from us (check spam if needed).
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden
            />
            Click the secure link to confirm your account.
          </li>
        </ul>
        <Link
          href={ROUTES.auth.login}
          className={cn(
            buttonVariants({ variant: "outline", size: "touch" }),
            "w-full",
          )}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form method="post" action="#" onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not create account</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Field id="signup-email" label="Email" required>
        <InputWithIcon leading={<Mail />}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </InputWithIcon>
      </Field>

      <Field
        id="signup-password"
        label="Password"
        description="At least 8 characters; longer and mixed is stronger."
        required
      >
        <PasswordInput
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
          minLength={8}
        />
        <PasswordStrength value={password} />
      </Field>

      <Field
        id="signup-confirm"
        label="Confirm password"
        required
        error={confirmMismatch ? "Passwords do not match." : undefined}
      >
        <PasswordInput
          name="confirmPassword"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.currentTarget.value)}
          required
        />
      </Field>

      <Button
        type="submit"
        size="touch"
        disabled={pending}
        aria-busy={pending}
        className={cn(
          "w-full gap-2 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90",
        )}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <div className="relative flex items-center justify-center" aria-hidden>
        <span className="h-px w-full bg-border" />
        <span className="absolute bg-card px-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          or
        </span>
      </div>

      <p className="flex min-h-11 flex-wrap items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
        <span>Already have an account?</span>
        <Link
          href={ROUTES.auth.login}
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
