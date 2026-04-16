import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import { ROUTES } from "@/lib/constants";

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
          This sign-in link is no longer valid. Request a new magic link or sign in with your password.
        </AlertDescription>
      </Alert>
    );
  }
  if (error === "auth") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Link expired or invalid</AlertTitle>
        <AlertDescription>
          Request a new reset link or try signing in again.
        </AlertDescription>
      </Alert>
    );
  }
  if (error === "credentials") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not sign in</AlertTitle>
        <AlertDescription>Invalid email or password.</AlertDescription>
      </Alert>
    );
  }
  if (error === "email_unconfirmed") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Confirm your email</AlertTitle>
        <AlertDescription>
          This account exists but the email address is not confirmed yet. Use the link in your inbox or
          request a new confirmation email from the sign-up flow.
        </AlertDescription>
      </Alert>
    );
  }
  if (error === "rate_limited") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Too many attempts</AlertTitle>
        <AlertDescription>
          Please wait a few minutes before trying again.
        </AlertDescription>
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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;

  // Never allow credentials in the query string (GET form leak, bookmarks, shared URLs).
  if (firstParam(sp.password) !== undefined) {
    const params = new URLSearchParams();
    const next = firstParam(sp.next);
    const error = firstParam(sp.error);
    const reset = firstParam(sp.reset);
    if (next) params.set("next", next);
    if (error) params.set("error", error);
    if (reset) params.set("reset", reset);
    const q = params.toString();
    redirect(q ? `${ROUTES.auth.login}?${q}` : ROUTES.auth.login);
  }

  const nextPath = sanitizeNextPath(firstParam(sp.next));

  return (
    <AuthCard
      title="Sign in"
      description="Use your email and password to continue to your resumes."
    >
      <div className="flex flex-col gap-6">
        {loginErrorAlert(firstParam(sp.error))}

        {firstParam(sp.reset) === "success" ? (
          <Alert>
            <AlertTitle>Password updated</AlertTitle>
            <AlertDescription>
              You can sign in with your new password.
            </AlertDescription>
          </Alert>
        ) : null}

        <LoginForm nextPath={nextPath} />
      </div>
    </AuthCard>
  );
}

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
