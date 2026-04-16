import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeNextPath } from "@/lib/auth/redirect";
import { ROUTES } from "@/lib/constants";
import { abuseHooks } from "@/lib/security/abuse-hooks";
import { getClientIp } from "@/lib/security/client-ip";
import { logSuspicious } from "@/lib/security/abuse-log";
import { enforceAuthLoginLimit } from "@/lib/security/rate-limit-enforcement";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { loginSchema } from "@/validation/auth";

function redirectToLogin(request: NextRequest, nextPath: string, error: string) {
  const u = new URL(ROUTES.auth.login, request.url);
  u.searchParams.set("next", nextPath);
  u.searchParams.set("error", error);
  return NextResponse.redirect(u);
}

/**
 * Password sign-in with session cookies applied to the redirect response.
 * Server Actions often cannot persist Supabase cookie mutations; a Route Handler can (same pattern as `/auth/callback`).
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const nextPath = sanitizeNextPath(formData.get("next")?.toString() ?? null);

  if (!parsed.success) {
    return redirectToLogin(request, nextPath, "credentials");
  }

  const ip = await getClientIp();
  const rl = await enforceAuthLoginLimit(ip);
  if (!rl.ok) {
    return redirectToLogin(request, nextPath, "rate_limited");
  }

  const allowed = await abuseHooks.allowLoginAttempt({
    ip,
    email: parsed.data.email,
  });
  if (!allowed) {
    logSuspicious("auth_hook_denied", { flow: "login", ip: ip.slice(0, 24) });
    return redirectToLogin(request, nextPath, "blocked");
  }

  const redirectTo = new URL(nextPath, request.url);
  const response = NextResponse.redirect(redirectTo);
  const supabase = createSupabaseMiddlewareClient(request, response);
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("invalid login") ||
      error.message.toLowerCase().includes("invalid credentials")
    ) {
      return redirectToLogin(request, nextPath, "credentials");
    }
    return redirectToLogin(request, nextPath, "credentials");
  }

  revalidatePath("/", "layout");
  return response;
}
