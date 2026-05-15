"use client";

import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

const MAX_ACCOUNT_AGE_MS = 10 * 60 * 1000;

/**
 * After a client-side auth success, if the Supabase user row looks newly created, emit
 * `signup_completed` once per browser tab (sessionStorage by user id).
 */
export function tryTrackSignupCompletedAfterAuth(
  user: { id: string; created_at?: string } | null | undefined,
  channel: string,
): void {
  if (!user?.id || !user.created_at) return;
  if (typeof window === "undefined" || typeof sessionStorage === "undefined") return;

  const key = `analytics_signup_completed_${user.id}`;
  if (sessionStorage.getItem(key)) return;

  const createdMs = new Date(user.created_at).getTime();
  if (!Number.isFinite(createdMs)) return;
  if (Date.now() - createdMs > MAX_ACCOUNT_AGE_MS) return;

  sessionStorage.setItem(key, "1");
  trackClientEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED, { channel });
}
