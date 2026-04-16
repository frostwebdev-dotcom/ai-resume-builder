"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PasswordStrength } from "@/components/auth/password-strength";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ROUTES } from "@/lib/constants";
import {
  resetPasswordAction,
  type AuthActionState,
} from "@/services/auth/actions";

const initial: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initial);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const confirmMismatch =
    confirm.length > 0 && password.length > 0 && confirm !== password;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not update password</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Field id="new-password" label="New password" required>
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
        id="confirm-new"
        label="Confirm new password"
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

      <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={ROUTES.auth.login}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 font-semibold text-brand underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
