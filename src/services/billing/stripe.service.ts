import "server-only";

import { getStripeServer } from "@/lib/stripe/server";

/**
 * Payment orchestration (checkout sessions, entitlements, webhooks) — expand in billing milestone.
 */
export const billingService = {
  getStripe: getStripeServer,
};
