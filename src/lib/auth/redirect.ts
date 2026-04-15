import { ROUTES } from "@/lib/constants";

/**
 * Prevent open redirects: only same-origin relative paths are allowed.
 */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || typeof next !== "string") {
    return ROUTES.app.root;
  }
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return ROUTES.app.root;
  }
  return trimmed;
}
