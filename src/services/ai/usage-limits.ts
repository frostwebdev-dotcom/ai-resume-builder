import "server-only";

import { enforceAiGenerationLimit } from "@/lib/security/rate-limit-enforcement";

/**
 * AI quota gate used by `runStructuredGeneration` (single enforcement point per request).
 * Redis rate limits; plan / DB quotas can be added later.
 */
export async function checkAiUsageAllowed(userId: string): Promise<
  | { allowed: true }
  | { allowed: false; reason: string; retryAfterSec?: number }
> {
  const rl = await enforceAiGenerationLimit(userId);
  if (!rl.ok) {
    return {
      allowed: false,
      reason: rl.message,
      retryAfterSec: rl.retryAfterSec,
    };
  }
  return { allowed: true };
}
