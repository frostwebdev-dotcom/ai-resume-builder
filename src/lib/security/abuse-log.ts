import "server-only";

/**
 * Structured warnings for security-relevant events (rate limits, repeated failures).
 * Wire to Sentry/metrics in production if desired.
 */
export function logSuspicious(event: string, details: Record<string, unknown>): void {
  const payload = {
    event,
    t: new Date().toISOString(),
    ...details,
  };
  console.warn("[security]", JSON.stringify(payload));
}
