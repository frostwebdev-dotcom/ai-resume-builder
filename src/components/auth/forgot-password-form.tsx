"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Inbox, Mail } from "lucide-react";

import { SubmitButton } from "@/components/auth/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import {
  forgotPasswordAction,
  type AuthActionState,
} from "@/services/auth/actions";

const initial: AuthActionState = {};

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email")?.trim() ?? "";
  const [state, formAction] = useActionState(forgotPasswordAction, initial);

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
          <h2 className="text-headline text-foreground">Email sent</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {state.success}
          </p>
        </div>
        <Link
          href={ROUTES.auth.login}
          className={cn(
            buttonVariants({ variant: "outline", size: "touch" }),
            "w-full gap-1.5",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Field
        id="forgot-email"
        label="Email"
        description="We will send a reset link if an account exists."
        required
      >
        <InputWithIcon leading={<Mail />}>
          <Input
            key={emailFromUrl || "no-email-query"}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={emailFromUrl}
          />
        </InputWithIcon>
      </Field>

      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>

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
