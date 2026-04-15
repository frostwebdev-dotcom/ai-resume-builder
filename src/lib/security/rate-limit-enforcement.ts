import "server-only";

import {
  getAiGenerationRateLimiter,
  getAuthForgotPasswordRateLimiter,
  getAuthLoginRateLimiter,
  getAuthPasswordResetRateLimiter,
  getAuthSignupRateLimiter,
  getCheckoutPollRateLimiter,
  getCheckoutStartRateLimiter,
  getPdfDownloadRateLimiter,
} from "@/lib/redis/rate-limit";

import { logSuspicious } from "./abuse-log";

const MSG_AI =
  "You're using AI faster than our limit allows. Please wait a short moment and try again.";
const MSG_AUTH_IP =
  "Too many attempts from this network. Please wait before trying again.";
const MSG_CHECKOUT =
  "Too many checkout attempts. Please wait before starting another payment.";
const MSG_POLL = "Too many requests. Please wait a moment.";
const MSG_PDF =
  "Too many download requests. Please wait a moment before trying again.";

function retryAfterSecFromReset(resetMs: number): number {
  if (!Number.isFinite(resetMs)) return 60;
  return Math.max(1, Math.ceil((resetMs - Date.now()) / 1000));
}

export type RateLimitOk = { ok: true };
export type RateLimitDenied = { ok: false; message: string; retryAfterSec?: number };

export async function enforceAiGenerationLimit(userId: string): Promise<RateLimitOk | RateLimitDenied> {
  const limiter = getAiGenerationRateLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(userId);
  if (success) return { ok: true };
  logSuspicious("rate_limit_ai", { userId, reset });
  return {
    ok: false,
    message: MSG_AI,
    retryAfterSec: retryAfterSecFromReset(reset),
  };
}

export async function enforcePdfDownloadLimit(userId: string): Promise<RateLimitOk | RateLimitDenied> {
  const limiter = getPdfDownloadRateLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(userId);
  if (success) return { ok: true };
  logSuspicious("rate_limit_pdf", { userId, reset });
  return {
    ok: false,
    message: MSG_PDF,
    retryAfterSec: retryAfterSecFromReset(reset),
  };
}

export async function enforceCheckoutStartLimit(userId: string): Promise<RateLimitOk | RateLimitDenied> {
  const limiter = getCheckoutStartRateLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(userId);
  if (success) return { ok: true };
  logSuspicious("rate_limit_checkout_start", { userId, reset });
  return {
    ok: false,
    message: MSG_CHECKOUT,
    retryAfterSec: retryAfterSecFromReset(reset),
  };
}

export async function enforceCheckoutPollLimit(userId: string): Promise<RateLimitOk | RateLimitDenied> {
  const limiter = getCheckoutPollRateLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(userId);
  if (success) return { ok: true };
  logSuspicious("rate_limit_checkout_poll", { userId, reset });
  return {
    ok: false,
    message: MSG_POLL,
    retryAfterSec: retryAfterSecFromReset(reset),
  };
}

export async function enforceAuthLoginLimit(ip: string): Promise<RateLimitOk | RateLimitDenied> {
  const limiter = getAuthLoginRateLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(ip);
  if (success) return { ok: true };
  logSuspicious("rate_limit_auth_login", { ip: ip.slice(0, 24), reset });
  return {
    ok: false,
    message: MSG_AUTH_IP,
    retryAfterSec: retryAfterSecFromReset(reset),
  };
}

export async function enforceAuthSignupLimit(ip: string): Promise<RateLimitOk | RateLimitDenied> {
  const limiter = getAuthSignupRateLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(ip);
  if (success) return { ok: true };
  logSuspicious("rate_limit_auth_signup", { ip: ip.slice(0, 24), reset });
  return {
    ok: false,
    message: MSG_AUTH_IP,
    retryAfterSec: retryAfterSecFromReset(reset),
  };
}

export async function enforceAuthForgotLimit(ip: string): Promise<RateLimitOk | RateLimitDenied> {
  const limiter = getAuthForgotPasswordRateLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(ip);
  if (success) return { ok: true };
  logSuspicious("rate_limit_auth_forgot", { ip: ip.slice(0, 24), reset });
  return {
    ok: false,
    message: MSG_AUTH_IP,
    retryAfterSec: retryAfterSecFromReset(reset),
  };
}

export async function enforceAuthPasswordResetLimit(userId: string): Promise<RateLimitOk | RateLimitDenied> {
  const limiter = getAuthPasswordResetRateLimiter();
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(userId);
  if (success) return { ok: true };
  logSuspicious("rate_limit_auth_password_reset", { userId, reset });
  return {
    ok: false,
    message: MSG_AUTH_IP,
    retryAfterSec: retryAfterSecFromReset(reset),
  };
}
