/**
 * Maps Supabase PostgREST / auth-related errors to user-facing copy for saves and mutations.
 */
export function mapPostgrestAuthError(err: { message?: string; code?: string } | null): string {
  const msg = (err?.message ?? "").toLowerCase();
  const code = err?.code ?? "";
  if (
    msg.includes("jwt") ||
    msg.includes("expired") ||
    msg.includes("refresh token") ||
    msg.includes("invalid grant") ||
    code === "PGRST301"
  ) {
    return "Your session expired. Refresh the page and sign in again to keep saving.";
  }
  return err?.message?.trim() ? err.message : "Could not save changes.";
}
