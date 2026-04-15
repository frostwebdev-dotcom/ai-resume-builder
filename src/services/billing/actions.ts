"use server";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackServerEvent } from "@/lib/analytics/server";
import {
  enforceCheckoutPollLimit,
  enforceCheckoutStartLimit,
} from "@/lib/security/rate-limit-enforcement";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createStripeCheckoutSession } from "@/services/billing/checkout-session";
import {
  createCheckoutSessionSchema,
  pollCheckoutOrderSchema,
} from "@/validation/billing";

export type StartCheckoutResult =
  | { ok: true; url: string }
  | {
      ok: false;
      error: string;
      code: "AUTH" | "NOT_FOUND" | "CONFIG" | "VALIDATION" | "RATE_LIMIT";
    };

async function getSessionUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Starts Stripe Checkout for a catalog SKU tied to a resume project.
 * Returns a Stripe-hosted URL; entitlement unlocks only after verified webhook.
 */
export async function startCheckoutAction(raw: unknown): Promise<StartCheckoutResult> {
  const parsed = createCheckoutSessionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid checkout request.", code: "VALIDATION" };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: "Sign in to continue to checkout.", code: "AUTH" };
  }

  const rl = await enforceCheckoutStartLimit(userId);
  if (!rl.ok) {
    return { ok: false, error: rl.message, code: "RATE_LIMIT" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: project, error } = await supabase
    .from("resume_projects")
    .select("id, title, user_id")
    .eq("id", parsed.data.projectId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !project) {
    return { ok: false, error: "Project not found.", code: "NOT_FOUND" };
  }

  trackServerEvent(ANALYTICS_EVENTS.CHECKOUT_STARTED, {
    product_sku: parsed.data.productSku,
    project_id_prefix: project.id.slice(0, 8),
  });

  return createStripeCheckoutSession({
    userId,
    projectId: project.id,
    projectTitle: project.title,
    productSku: parsed.data.productSku,
  });
}

export type PollCheckoutStatusResult =
  | { ok: true; status: "pending" | "processing" | "completed" | "failed" | "refunded" }
  | { ok: false; error: string };

/**
 * Polls order status for the return page (server reads DB; still no client-side unlock).
 */
export async function pollCheckoutOrderStatusAction(
  raw: unknown,
): Promise<PollCheckoutStatusResult> {
  const parsed = pollCheckoutOrderSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, error: "Sign in again to refresh checkout status." };
  }

  const pollRl = await enforceCheckoutPollLimit(userId);
  if (!pollRl.ok) {
    return { ok: false, error: pollRl.message };
  }

  const supabase = await createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("status, project_id")
    .eq("stripe_checkout_session_id", parsed.data.checkoutSessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !order || order.project_id !== parsed.data.projectId) {
    return { ok: false, error: "Order not found." };
  }

  return { ok: true, status: order.status };
}
