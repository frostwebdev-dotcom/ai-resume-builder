"use client";

import { useActionState } from "react";
import Link from "next/link";

import { SubmitButton } from "@/components/auth/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ROUTES } from "@/lib/constants";
import { signupAction, type AuthActionState } from "@/services/auth/actions";

const initial: AuthActionState = {};

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not create account</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.success ? (
        <Alert>
          <AlertTitle>Check your email</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}

      {!state.success ? (
        <>
          <Field id="signup-email" label="Email" required>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>

          <Field id="signup-password" label="Password" required>
            <Input
              name="password"
              type="password"
              autoComplete="new-password"
            />
          </Field>

          <Field id="signup-confirm" label="Confirm password" required>
            <Input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
            />
          </Field>

          <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
        </>
      ) : null}

      <p className="flex min-h-11 flex-wrap items-center justify-center gap-1 text-center text-sm text-muted-foreground">
        <span>Already have an account?</span>
        <Link
          href={ROUTES.auth.login}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
