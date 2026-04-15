import type { z } from "zod";

/** First human-readable issue from a Zod error (forms / server actions). */
export function firstZodIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? "Check your input and try again.";
}

/** Flatten field errors for auth-style forms. */
export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
