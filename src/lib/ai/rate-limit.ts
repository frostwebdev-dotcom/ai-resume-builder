import "server-only";

/**
 * Resume AI rate limits (Upstash Redis).
 *
 * Per-request enforcement for model calls happens inside {@link runStructuredGeneration}
 * via {@link checkAiUsageAllowed} → {@link enforceAiGenerationLimit}. Export this alias so
 * API routes or other callers can preflight without invoking OpenAI when needed.
 */
export { enforceAiGenerationLimit as enforceResumeAiRateLimit } from "@/lib/security/rate-limit-enforcement";
