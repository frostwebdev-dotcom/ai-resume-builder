"use client";

import { useActionState } from "react";
import Link from "next/link";

import { SubmitButton } from "@/components/auth/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROUTES } from "@/lib/constants";
import { loginAction, type AuthActionState } from "@/services/auth/actions";

const initial: AuthActionState = {};

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="next" value={nextPath} />

      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not sign in</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Field id="login-email" label="Email" required>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </Field>

      <Field id="login-password" label="Password" required>
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
        />
      </Field>

      <div className="flex flex-col gap-4">
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
        <div className="flex flex-col gap-1 text-center text-sm text-muted-foreground">
          <Link
            href={ROUTES.auth.forgotPassword}
            className="inline-flex min-h-11 items-center justify-center font-medium text-foreground underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
          <p className="inline-flex min-h-11 flex-wrap items-center justify-center gap-1">
            <span>No account?</span>
            <Link
              href={ROUTES.auth.signup}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
