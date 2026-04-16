"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROUTES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { loginSchema } from "@/validation/auth";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  nextPath: string;
};

function errorAlert(code: string | null) {
  if (!code) return null;
  if (code === "email_unconfirmed") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Confirm your email</AlertTitle>
        <AlertDescription>
          This account exists but the email address is not confirmed yet. Use the link in your inbox or sign
          up again to resend.
        </AlertDescription>
      </Alert>
    );
  }
  if (code === "credentials") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not sign in</AlertTitle>
        <AlertDescription>Invalid email or password.</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive">
      <AlertTitle>Could not sign in</AlertTitle>
      <AlertDescription>Something went wrong. Try again.</AlertDescription>
    </Alert>
  );
}

/**
 * Signs in with the browser Supabase client so the session is stored in cookies via `document.cookie`.
 * Server routes and Server Actions are unreliable for persisting Supabase cookie chunks in some setups.
 */
export function LoginForm({ nextPath }: LoginFormProps) {
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorCode(null);

    const formData = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setErrorCode("credentials");
      return;
    }

    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes("email not confirmed")) {
          setErrorCode("email_unconfirmed");
        } else {
          setErrorCode("credentials");
        }
        setPending(false);
        return;
      }

      // Ensure cookie storage finished before full navigation (avoids RSC seeing no session).
      await supabase.auth.getSession();

      // Relative path from `sanitizeNextPath` — resolves on the current origin (localhost vs 127.0.0.1).
      window.location.href = nextPath;
    } catch {
      setErrorCode("unknown");
      setPending(false);
    }
  }

  return (
    <form method="post" action="#" onSubmit={handleSubmit} className="flex flex-col gap-6">
      {errorAlert(errorCode)}

      <Field id="login-email" label="Email" required>
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
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
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
