import { SignupStartedTracker } from "@/components/analytics/signup-started-tracker";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Pick a password — or skip it entirely and use a one-time link sent to your email."
    >
      <SignupStartedTracker />
      <SignupForm />
    </AuthCard>
  );
}

export const metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
};
