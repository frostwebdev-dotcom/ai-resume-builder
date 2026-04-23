import { ROUTES } from "@/lib/constants";

/**
 * Whether the pathname is reachable without a session (marketing, auth flows, auth API callback).
 */
export function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next")) {
    return true;
  }
  if (pathname === "/") return true;
  if (pathname.startsWith("/create")) return true;
  /** Guest dashboard, resumes, cover-letters, and jobs index (other `/app/*` routes stay protected). */
  if (pathname === ROUTES.app.root || pathname === `${ROUTES.app.root}/`) {
    return true;
  }
  if (pathname === ROUTES.app.resumes || pathname === `${ROUTES.app.resumes}/`) {
    return true;
  }
  if (pathname === ROUTES.app.coverLetters || pathname === `${ROUTES.app.coverLetters}/`) {
    return true;
  }
  if (pathname === ROUTES.app.jobs || pathname === `${ROUTES.app.jobs}/`) {
    return true;
  }
  if (
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/how-it-works") ||
    pathname.startsWith("/templates") ||
    pathname.startsWith("/faq") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/style-guide") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth/")
  ) {
    return true;
  }
  return false;
}

export function defaultAuthenticatedPath(): string {
  return ROUTES.app.root;
}
