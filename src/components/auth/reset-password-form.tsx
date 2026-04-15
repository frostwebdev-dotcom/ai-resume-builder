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
import { resetPasswordAction, type AuthActionState } from "@/services/auth/actions";

const initial: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not update password</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Field id="new-password" label="New password" required>
        <Input name="password" type="password" autoComplete="new-password" />
      </Field>

      <Field id="confirm-new" label="Confirm new password" required>
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
        />
      </Field>

      <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>

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
