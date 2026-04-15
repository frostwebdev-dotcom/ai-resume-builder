import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Enter the email you used to register. We will email a secure link."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

export const metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};
