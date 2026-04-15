import { SignupStartedTracker } from "@/components/analytics/signup-started-tracker";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Start building your resume. You can confirm your email if required by your workspace."
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
