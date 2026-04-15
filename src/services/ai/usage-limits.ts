import "server-only";

import { enforceAiGenerationLimit } from "@/lib/security/rate-limit-enforcement";

/**
 * Central gate for AI features: Redis rate limits now; plan / DB quotas can be added later.
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
