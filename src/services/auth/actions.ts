"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sanitizeNextPath } from "@/lib/auth/redirect";
import { clientEnv } from "@/lib/env";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import { ROUTES } from "@/lib/constants";
import { abuseHooks } from "@/lib/security/abuse-hooks";
import { logSuspicious } from "@/lib/security/abuse-log";
import { getClientIp } from "@/lib/security/client-ip";
import {
  enforceAuthForgotLimit,
  enforceAuthPasswordResetLimit,
  enforceAuthSignupLimit,
} from "@/lib/security/rate-limit-enforcement";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { trySendWelcomeEmail } from "@/services/email/welcome";
import { sendPasswordUpdatedEmail } from "@/services/email/password-updated";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/validation/auth";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function authCallbackUrl(nextPath: string): string {
  const base = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const next = encodeURIComponent(sanitizeNextPath(nextPath));
  return `${base}${ROUTES.auth.callback}?next=${next}`;
}

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const err = parsed.error.flatten();
    return {
      error:
        err.fieldErrors.email?.[0] ??
        err.fieldErrors.password?.[0] ??
        err.fieldErrors.confirmPassword?.[0] ??
        "Fix the highlighted fields.",
    };
  }

  const ip = await getClientIp();
  const rl = await enforceAuthSignupLimit(ip);
  if (!rl.ok) {
    return { error: rl.message };
  }

  const allowed = await abuseHooks.allowSignupRequest({
    ip,
    email: parsed.data.email,
  });
  if (!allowed) {
    logSuspicious("auth_hook_denied", { flow: "signup", ip: ip.slice(0, 24) });
    return { error: "Sign up is temporarily unavailable. Please try again later." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: authCallbackUrl(ROUTES.app.root),
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "An account with this email already exists. Try signing in." };
    }
    return { error: error.message };
  }

  trackServerEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED, {
    has_session: Boolean(data.session),
  });

  if (data.session) {
    if (data.user?.email) {
      void trySendWelcomeEmail(data.user.id, data.user.email).catch((e) =>
        console.error("[auth] welcome email", e),
      );
    }
    revalidatePath("/", "layout");
    redirect(ROUTES.app.root);
  }

  return {
    success:
      "Check your email for a confirmation link. After confirming, you can sign in.",
  };
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] ?? "Enter a valid email." };
  }

  const ip = await getClientIp();
  const rl = await enforceAuthForgotLimit(ip);
  if (!rl.ok) {
    return { error: rl.message };
  }

  const allowed = await abuseHooks.allowForgotPasswordRequest({
    ip,
    email: parsed.data.email,
  });
  if (!allowed) {
    logSuspicious("auth_hook_denied", { flow: "forgot_password", ip: ip.slice(0, 24) });
    return { error: "Something went wrong. Please try again later." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: authCallbackUrl(ROUTES.auth.resetPassword),
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "If an account exists for that email, we sent a link to reset your password.",
  };
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const err = parsed.error.flatten();
    return {
      error:
        err.fieldErrors.password?.[0] ??
        err.fieldErrors.confirmPassword?.[0] ??
        "Fix the highlighted fields.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: beforeUser },
  } = await supabase.auth.getUser();
  const email = beforeUser?.email ?? null;

  if (beforeUser?.id) {
    const rl = await enforceAuthPasswordResetLimit(beforeUser.id);
    if (!rl.ok) {
      return { error: rl.message };
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  if (email) {
    void sendPasswordUpdatedEmail(email).catch((e) => console.error("[auth] password-updated email", e));
  }

  revalidatePath("/", "layout");
  redirect(`${ROUTES.auth.login}?reset=success`);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(ROUTES.auth.login);
}
