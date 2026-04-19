import "server-only";

import { serverEnv } from "@/lib/env";

/**
 * True when Stripe Checkout sessions can be created (server secret present).
 * Use this to avoid showing a non-functional “Unlock PDF” CTA in environments
 * where payments are not wired (local dev, misconfigured deploy).
 */
export function isStripeCheckoutConfigured(): boolean {
  return Boolean(serverEnv.STRIPE_SECRET_KEY?.trim());
}
