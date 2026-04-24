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
          That sign-in link is no longer valid. Request a new one below — it only takes a second.
        </AlertDescription>
      </Alert>
    );
  }
  if (error === "auth") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t finish sign-in</AlertTitle>
        <AlertDescription>
          The link may have already been used or expired. Request a new one below.
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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const nextPath = sanitizeNextPath(firstParam(sp.next));

  return (
    <AuthCard
      title="Welcome"
      description="Sign in with email and password, Google, or a one-time email link."
    >
      <div className="flex flex-col gap-6">
        {loginErrorAlert(firstParam(sp.error))}
        <LoginForm nextPath={nextPath} />
      </div>
    </AuthCard>
  );
}

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
