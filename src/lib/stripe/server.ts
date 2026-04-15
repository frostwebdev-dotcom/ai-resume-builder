import "server-only";

import Stripe from "stripe";

import { serverEnv } from "@/lib/env";

let stripe: Stripe | null = null;

/**
 * Lazy Stripe SDK instance for server-only payment logic.
 */
export function getStripeServer(): Stripe {
  if (!serverEnv.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!stripe) {
    stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return stripe;
}
