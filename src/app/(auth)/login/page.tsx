import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { sanitizeNextPath } from "@/lib/auth/redirect";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    reset?: string;
  }>;
};

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
  const nextPath = sanitizeNextPath(sp.next);

  return (
    <AuthCard
      title="Sign in"
      description="Use your email and password to continue to your resumes."
    >
      <div className="flex flex-col gap-6">
        {loginErrorAlert(sp.error)}

        {sp.reset === "success" ? (
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
