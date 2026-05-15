/**
 * User-facing strings for Supabase Auth failures.
 * Prefer these over raw `error.message` to avoid leaking internal/provider details.
 */

export const AUTH_ERROR_TRY_AGAIN =
  "Something went wrong. Please try again in a moment.";

/** Forgot-password email send (`resetPasswordForEmail`). */
export function mapForgotPasswordEmailError(message: string | undefined): string {
  if (!message) return AUTH_ERROR_TRY_AGAIN;
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many") || m.includes("over_email_send_rate")) {
    return "Too many reset requests. Please wait a few minutes before trying again.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "That email address doesn’t look valid. Check for typos and try again.";
  }
  return "We couldn’t send a reset email right now. Try again in a few minutes.";
}

/** Password update after recovery (`updateUser({ password })`). */
export function mapResetPasswordUpdateError(message: string | undefined): string {
  if (!message) {
    return "Could not update your password. Request a new reset link from the sign-in page.";
  }
  const m = message.toLowerCase();
  if (m.includes("session") || m.includes("jwt") || m.includes("expired")) {
    return "This reset link is invalid or expired. Request a new one from Forgot password.";
  }
  if (
    m.includes("weak") ||
    m.includes("least") ||
    m.includes("short") ||
    (m.includes("password") && m.includes("long"))
  ) {
    return "Use a stronger password — at least 8 characters, and avoid very common passwords.";
  }
  if (m.includes("same") && m.includes("password")) {
    return "Choose a different password than the one you used before.";
  }
  return "Could not update your password. Request a new reset link from the sign-in page.";
}

/** Email OTP `verifyOtp` failures (non-expired branches). */
export function mapEmailOtpVerifyError(message: string | undefined): string {
  if (!message) return "Could not verify the code. Try again or request a new code.";
  const m = message.toLowerCase();
  if (m.includes("expired") || m.includes("invalid")) {
    return "That code is wrong or expired. Request a new code and try again.";
  }
  return "Could not verify the code. Try again or request a new code.";
}

/** `signUp` with email + password (panel / future paths). */
export function mapSignUpError(message: string | undefined): string {
  if (!message) return "Could not create your account. Try again.";
  const m = message.toLowerCase();
  if (m.includes("already") || m.includes("registered") || m.includes("exists")) {
    return "That email already has an account. Use Send sign-in code, or continue with Google.";
  }
  if (m.includes("password")) {
    return "That password doesn’t meet the requirements. Use at least 8 characters.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Too many attempts. Wait a few minutes and try again.";
  }
  return "Could not create your account. Try again.";
}

/** Password sign-in unexpected errors (after known branches in the form). */
export function mapPasswordSignInServerError(_message: string | undefined): string {
  return "Could not sign in. Try the email code, check your password, or use Google.";
}
