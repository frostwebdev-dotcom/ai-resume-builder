import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { sanitizeNextPath } from "@/lib/auth/redirect";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function loginErrorAlert(error: string | undefined) {
  if (error === "link_expired") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Link expired</AlertTitle>
        <AlertDescription>
          That sign-in code or link is no longer valid. Request a new code below.
        </AlertDescription>
      </Alert>
    );
  }
  if (error === "auth") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t finish sign-in</AlertTitle>
        <AlertDescription>
          The code or link may have already been used or expired. Request a new code below.
        </AlertDescription>
      </Alert>
    );
  }
  if (error === "rate_limited") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Too many attempts</AlertTitle>
        <AlertDescription>Please wait a few minutes before trying again.</AlertDescription>
      </Alert>
    );
  }
  if (error === "blocked") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Sign-in unavailable</AlertTitle>
        <AlertDescription>Something went wrong. Please try again later.</AlertDescription>
      </Alert>
    );
  }
  return null;
}

function resetSuccessAlert(reset: string | undefined) {
  if (reset !== "success") return null;
  return (
    <Alert variant="success">
      <CheckCircle2 aria-hidden />
      <AlertTitle>Password updated</AlertTitle>
      <AlertDescription>You can sign in with your new password below.</AlertDescription>
    </Alert>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const nextPath = sanitizeNextPath(firstParam(sp.next));
  const signupIntent = firstParam(sp.intent) === "signup";

  return (
    <AuthCard
      title={signupIntent ? "Create your account" : "Welcome"}
      description={
        signupIntent
          ? "Use your email for a one-time code, continue with Google, or create a password — same secure sign-in as returning users."
          : "Sign in with a one-time email code, Google, or your password. New here? Your account is created when you verify your email code."
      }
    >
      <div className="flex flex-col gap-6">
        {resetSuccessAlert(firstParam(sp.reset))}
        {loginErrorAlert(firstParam(sp.error))}
        <LoginForm nextPath={nextPath} signupIntent={signupIntent} />
      </div>
    </AuthCard>
  );
}

export async function generateMetadata({
  searchParams,
}: LoginPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const signup = firstParam(sp.intent) === "signup";
  return {
    title: signup ? "Create account" : "Sign in",
    robots: { index: false, follow: false },
  };
}
