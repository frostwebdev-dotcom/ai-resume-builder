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
import { forgotPasswordAction, type AuthActionState } from "@/services/auth/actions";

const initial: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.success ? (
        <Alert>
          <AlertTitle>Email sent</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}

      {!state.success ? (
        <>
          <Field
            id="forgot-email"
            label="Email"
            description="We will send a reset link if an account exists."
            required
          >
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>

          <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
        </>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={ROUTES.auth.login}
          className="inline-flex min-h-11 items-center justify-center font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
