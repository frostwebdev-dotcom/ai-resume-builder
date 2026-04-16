import "server-only";

import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import { getAuthContext, getSessionUser } from "@/lib/auth/session";
import type { AuthContext } from "@/lib/auth/session";

/**
 * Require a logged-in user for Server Components / Server Actions.
 */
export async function requireUser(options?: { nextPath?: string }): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (ctx) {
    return ctx;
  }

  const user = await getSessionUser();
  if (user) {
    redirect(ROUTES.auth.incomplete);
  }

  const next = options?.nextPath ? `?next=${encodeURIComponent(options.nextPath)}` : "";
  redirect(`${ROUTES.auth.login}${next}`);
}

/**
 * Require admin role (after session).
 */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (ctx.profile.role !== "admin") {
    redirect(ROUTES.app.root);
  }
  return ctx;
}

/**
 * Server-side check without redirect — for conditional UI in RSC.
 */
export async function getOptionalAuth(): Promise<AuthContext | null> {
  return getAuthContext();
}

/**
 * Returns true if the current request has a Supabase user (lightweight).
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getSessionUser();
  return user !== null;
}

/**
 * Parse `next` from a URL pathname for post-login redirect (guards).
 */
export function loginRedirectFromPathname(pathname: string): string {
  return `${ROUTES.auth.login}?next=${encodeURIComponent(sanitizeNextPath(pathname))}`;
}
