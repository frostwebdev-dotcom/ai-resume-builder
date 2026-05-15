"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sanitizeNextPath } from "@/lib/auth/redirect";
import {
  mapForgotPasswordEmailError,
  mapResetPasswordUpdateError,
} from "@/lib/auth/supabase-auth-errors";
import { clientEnv } from "@/lib/env";
import { ROUTES } from "@/lib/constants";
import { abuseHooks } from "@/lib/security/abuse-hooks";
import { logSuspicious } from "@/lib/security/abuse-log";
import { getClientIp } from "@/lib/security/client-ip";
import {
  enforceAuthForgotLimit,
  enforceAuthPasswordResetLimit,
} from "@/lib/security/rate-limit-enforcement";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendPasswordUpdatedEmail } from "@/services/email/password-updated";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
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
    console.warn("[forgot-password]", error.message);
    return { error: mapForgotPasswordEmailError(error.message) };
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

  if (!beforeUser?.id) {
    return {
      error:
        "Your reset session is missing or expired. Open the link from your latest reset email, or request a new one from Forgot password.",
    };
  }

  const rl = await enforceAuthPasswordResetLimit(beforeUser.id);
  if (!rl.ok) {
    return { error: rl.message };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    console.warn("[reset-password]", error.message);
    return { error: mapResetPasswordUpdateError(error.message) };
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
