"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Inbox, Mail } from "lucide-react";

import { PasswordStrength } from "@/components/auth/password-strength";
import { SubmitButton } from "@/components/auth/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { signupAction, type AuthActionState } from "@/services/auth/actions";

const initial: AuthActionState = {};

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initial);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const confirmMismatch =
    confirm.length > 0 && password.length > 0 && confirm !== password;

  if (state.success) {
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
            {state.success}
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
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not create account</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Field id="signup-email" label="Email" required>
        <InputWithIcon leading={<Mail />}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
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

      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>

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
