import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      description="After clicking the link in your email, set a strong password you have not used elsewhere."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}

export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};
