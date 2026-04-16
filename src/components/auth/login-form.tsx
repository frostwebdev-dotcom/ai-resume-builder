"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { PasswordInput } from "@/components/ui/password-input";
import { ROUTES } from "@/lib/constants";

type LoginFormProps = {
  nextPath: string;
};

/**
 * Posts to a Route Handler so Supabase session cookies are written onto the redirect response.
 * (Server Action cookie writes are often dropped in this Next.js + Supabase SSR setup.)
 */
export function LoginForm({ nextPath }: LoginFormProps) {
  return (
    <form action="/api/auth/sign-in" method="post" className="flex flex-col gap-6">
      <input type="hidden" name="next" value={nextPath} />

      <Field id="login-email" label="Email" required>
        <InputWithIcon leading={<Mail />}>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </InputWithIcon>
      </Field>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="login-password"
            className="text-label flex items-center gap-0"
          >
            Password
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          </label>
          <Link
            href={ROUTES.auth.forgotPassword}
            className="text-xs font-medium text-brand underline-offset-4 hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="flex flex-col gap-5">
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
        <div
          className="relative flex items-center justify-center"
          aria-hidden
        >
          <span className="h-px w-full bg-border" />
          <span className="absolute bg-card px-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            or
          </span>
        </div>
        <p className="flex min-h-11 flex-wrap items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
          <span>New here?</span>
          <Link
            href={ROUTES.auth.signup}
            className="font-semibold text-brand underline-offset-4 hover:underline"
          >
            Create a free account
          </Link>
        </p>
      </div>
    </form>
  );
}
