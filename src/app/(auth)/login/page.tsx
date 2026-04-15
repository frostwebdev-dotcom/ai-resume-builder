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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const nextPath = sanitizeNextPath(sp.next);

  return (
    <AuthCard
      title="Sign in"
      description="Use your email and password to continue to your resumes."
    >
      <div className="flex flex-col gap-6">
        {sp.error === "auth" ? (
          <Alert variant="destructive">
            <AlertTitle>Link expired or invalid</AlertTitle>
            <AlertDescription>
              Request a new reset link or try signing in again.
            </AlertDescription>
          </Alert>
        ) : null}

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
