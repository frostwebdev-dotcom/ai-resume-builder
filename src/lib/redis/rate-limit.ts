import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { serverEnv } from "@/lib/env";

/**
 * Shared Upstash Redis client for all rate limiters (single connection pool).
 */
let redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = serverEnv.UPSTASH_REDIS_REST_URL;
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  if (!redis) {
    redis = new Redis({ url, token });
  }
  return redis;
}

const cache = new Map<string, Ratelimit>();

function getLimiter(
  name: string,
  max: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (!cache.has(name)) {
    cache.set(
      name,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(max, window),
        analytics: true,
        prefix: `smart-resume-builder:${name}`,
      }),
    );
  }
  return cache.get(name) ?? null;
}

/** AI generation (summary, skills, job tailoring, etc.) — per authenticated user. */
export function getAiGenerationRateLimiter(): Ratelimit | null {
  return getLimiter("ai_user", 60, "15 m");
}

/** PDF generation + signed URL — per user (expensive I/O). */
export function getPdfDownloadRateLimiter(): Ratelimit | null {
  return getLimiter("pdf_user", 40, "15 m");
}

/** AI résumé file import (guest or signed) — per IP or per user id key. */
export function getResumeImportRateLimiter(): Ratelimit | null {
  return getLimiter("resume_import", 15, "1 h");
}

/** Stripe checkout session creation — per user. */
export function getCheckoutStartRateLimiter(): Ratelimit | null {
  return getLimiter("checkout_start", 25, "1 h");
}

/** Checkout return polling — per user (high frequency OK, still bounded). */
export function getCheckoutPollRateLimiter(): Ratelimit | null {
  return getLimiter("checkout_poll", 120, "1 m");
}

/** Login attempts — per client IP. */
export function getAuthLoginRateLimiter(): Ratelimit | null {
  return getLimiter("auth_login_ip", 25, "15 m");
}

/** Signup — per client IP. */
export function getAuthSignupRateLimiter(): Ratelimit | null {
  return getLimiter("auth_signup_ip", 8, "1 h");
}

/** Password reset request — per client IP. */
export function getAuthForgotPasswordRateLimiter(): Ratelimit | null {
  return getLimiter("auth_forgot_ip", 6, "1 h");
}

/** Password update on recovery page — per user id. */
export function getAuthPasswordResetRateLimiter(): Ratelimit | null {
  return getLimiter("auth_reset_user", 20, "1 h");
}

/** Public marketing contact form — per client IP. */
export function getContactFormRateLimiter(): Ratelimit | null {
  return getLimiter("contact_form_ip", 10, "1 h");
}

/**
 * @deprecated Use getPdfDownloadRateLimiter — kept for any stale imports.
 */
export function getRateLimiter(): Ratelimit | null {
  return getPdfDownloadRateLimiter();
}
