/**
 * Sentinel project id used only by the public `/create` draft.
 * It is a valid UUID so existing AI validation schemas can stay strict.
 */
export const GUEST_AI_PROJECT_ID = "00000000-0000-4000-8000-000000000000";

export function isGuestAiProjectId(projectId: string | null | undefined): boolean {
  return projectId === GUEST_AI_PROJECT_ID;
}

export function guestAiUserKey(ip: string): string {
  return `guest:${ip || "unknown"}`;
}
