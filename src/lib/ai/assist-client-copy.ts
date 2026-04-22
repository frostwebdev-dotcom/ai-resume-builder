/**
 * Client-safe copy for AI assist UI (no server-only imports).
 */

/** Headline & profile panel — main Improve buttons. */
export const AI_ASSIST_PROFILE_LINE =
  "Updates headline & profile from your fields and notes only—does not invent employers, roles, or dates you did not give.";

/** Same panel — “Align to role” uses the target role + optional keywords you type. */
export const AI_ASSIST_PROFILE_ROLE_LINE =
  "Rewrites profile using your headline, summary, target role, and optional keywords—still does not invent employers or jobs you did not describe.";

/** Per-experience bullet actions. */
export const AI_ASSIST_EXPERIENCE_LINE =
  "Rewrites these bullets from your content—does not invent employers, dates, or metrics you did not write.";

/** Skills list. */
export const AI_ASSIST_SKILLS_LINE =
  "Rewrites your list from what you typed—does not add skills or tools you did not mention.";

/** Additional / free-text box. */
export const AI_ASSIST_ADDITIONAL_LINE =
  "Clarifies wording in this box only—does not pull facts from other sections.";

/** Near “match saved posting” tailor buttons (signed-in Draft). */
export const AI_MATCH_SAVED_POSTING_LINE =
  "Suggests wording aligned to the posting you saved from your draft—does not invent employers or dates; verify before you apply.";

/** Shown with the guest job-target card (module-level). */
export const AI_JOB_POSTING_TAILOR_DISCLAIMER =
  "Posting-based suggestions use your saved text and draft only—they do not invent employers or timelines; verify before you apply.";

/**
 * Turn server `error` + optional `code` into short, actionable UI text.
 */
export function formatAiAssistClientMessage(error: string, code?: string): string {
  const trimmed = error.trim();
  switch (code) {
    case "AUTH":
      return "Sign-in required for this action. Open Log in, return to this page, then retry—or refresh if your session expired.";
    case "RATE_LIMIT":
      return trimmed;
    case "NO_AI":
      return `${trimmed} If this should work here, try again later or ask your admin to enable the AI key.`;
    case "NO_JOB":
      return `${trimmed} Paste a posting in Job posting (optional) above, save, then retry.`;
    case "NOT_FOUND": {
      if (/No tailored summary to apply/i.test(trimmed)) {
        return "Nothing to apply. Run “Align profile to posting” again, then accept.";
      }
      if (/No tailored skills to apply/i.test(trimmed)) {
        return "Nothing to apply. Run “Align skills to posting” again, then accept.";
      }
      if (/No tailored bullets to apply/i.test(trimmed)) {
        return "Nothing to apply. Run “Align bullets to posting” again, then accept.";
      }
      if (/Nothing to (apply|update)/i.test(trimmed)) {
        return "Could not load the saved suggestion. Refresh the page and try again.";
      }
      return `${trimmed} Refresh the page or reopen the project from the dashboard.`;
    }
    case "VALIDATION":
      return trimmed;
    case "429":
    case "503":
    case "502":
    case "500":
      return trimmed || "The AI service is busy. Wait a moment and retry.";
    case "JSON_PARSE":
    case "SCHEMA_MISMATCH":
    case "EMPTY_RESPONSE":
      return `${trimmed} Try again; if it repeats, shorten the text and retry.`;
    case "UNKNOWN":
      return trimmed.includes("try again")
        ? trimmed
        : `${trimmed} Check your connection and retry.`;
    default:
      break;
  }
  if (trimmed === "Request failed. Try again.") {
    return "Network or server error. Check your connection and retry.";
  }
  return trimmed;
}
