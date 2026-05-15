import "server-only";

import type Stripe from "stripe";

import { getStripeServer } from "@/lib/stripe/server";
import { serverEnv } from "@/lib/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { persistProductAnalyticsEvent } from "@/lib/analytics/persist-product-event";
import { trackServerEvent } from "@/lib/analytics/server";
import type { Json } from "@/types/database";
import { sendPurchaseReceiptEmailIfNeeded } from "@/services/email/stripe-receipt";

function mergeOrderMeta(existing: Json | null, patch: Record<string, unknown>): Json {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? ({ ...existing } as Record<string, unknown>)
      : {};
  const events = Array.isArray(base.webhook_events)
    ? ([...base.webhook_events] as unknown[])
    : [];
  const ev = patch.event;
  if (ev && typeof ev === "object") {
    events.push(ev);
  }
  const { event: _e, ...rest } = patch;
  void _e;
  return { ...base, ...rest, webhook_events: events.slice(-20) } as Json;
}

function metadataString(meta: Stripe.Metadata | null | undefined, key: string): string | null {
  const v = meta?.[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * Core idempotent completion: one completed order + at most one payment row per order
 * (Stripe may deliver `checkout.session.completed` and `payment_intent.succeeded`).
 */
async function finalizeOrderPaid(params: {
  orderId: string;
  /** Must match the row written at Checkout session creation (anti session-replay). */
  stripeCheckoutSessionId: string;
  paymentIntentId: string | null;
  amountCents: number | null;
  currency: string | null;
  /** For audit / metadata only */
  webhookEvent: Record<string, unknown>;
}): Promise<void> {
  const service = createSupabaseServiceRoleClient();

  const { data: order, error: fetchErr } = await service
    .from("orders")
    .select(
      "id, user_id, status, metadata, amount_cents, currency, project_id, product_sku, stripe_checkout_session_id",
    )
    .eq("id", params.orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    console.error("[webhook] order lookup", fetchErr);
    return;
  }

  if (order.status === "completed") {
    return;
  }

  if (
    order.stripe_checkout_session_id &&
    order.stripe_checkout_session_id !== params.stripeCheckoutSessionId
  ) {
    console.error("[webhook] checkout session mismatch for order", params.orderId);
    return;
  }

  const paidAt = new Date().toISOString();
  const amountCents =
    typeof params.amountCents === "number" && params.amountCents >= 0
      ? params.amountCents
      : order.amount_cents;
  const currency =
    (params.currency as string | undefined)?.toLowerCase() ??
    (order.currency as string | undefined) ??
    "usd";

  if (
    typeof params.amountCents === "number" &&
    params.amountCents >= 0 &&
    params.amountCents !== order.amount_cents
  ) {
    console.warn("[webhook] amount_total differs from order.amount_cents", {
      orderId: order.id,
      orderAmount: order.amount_cents,
      paidAmount: params.amountCents,
    });
  }

  const { data: existingByOrder } = await service
    .from("payments")
    .select("id")
    .eq("order_id", order.id)
    .limit(1)
    .maybeSingle();

  if (!existingByOrder) {
    const { error: payErr } = await service.from("payments").insert({
      order_id: order.id,
      stripe_payment_intent_id: params.paymentIntentId,
      amount_cents: amountCents,
      currency,
      status: "paid",
      paid_at: paidAt,
    });
    if (payErr) {
      if (payErr.code === "23505") {
        // unique stripe_payment_intent_id — concurrent webhook; continue to order update
      } else {
        console.error("[webhook] payment insert", payErr);
        return;
      }
    }
  }

  const { data: updatedRows, error: ordErr } = await service
    .from("orders")
    .update({
      status: "completed",
      stripe_checkout_session_id: params.stripeCheckoutSessionId,
      metadata: mergeOrderMeta(order.metadata as Json, {
        paid_at: paidAt,
        stripe_payment_intent_id: params.paymentIntentId,
        event: params.webhookEvent,
      }),
    })
    .eq("id", order.id)
    .in("status", ["pending", "processing"])
    .select("id");

  if (ordErr) {
    console.error("[webhook] order update", ordErr);
    return;
  }

  if (!updatedRows?.length) {
    return;
  }

  trackServerEvent(ANALYTICS_EVENTS.PAYMENT_SUCCEEDED, {
    product_sku: order.product_sku,
    order_id_prefix: order.id.slice(0, 8),
    amount_cents: amountCents,
  });

  void persistProductAnalyticsEvent(ANALYTICS_EVENTS.PAYMENT_SUCCEEDED, {
    product_sku: order.product_sku,
    order_id_prefix: order.id.slice(0, 8),
    amount_cents: amountCents,
  });

  const sessionForReceipt: Stripe.Checkout.Session = {
    id: params.stripeCheckoutSessionId,
    object: "checkout.session",
    amount_total: amountCents,
    currency,
    payment_intent: params.paymentIntentId ?? undefined,
    metadata: { order_id: order.id } as Stripe.Metadata,
  } as Stripe.Checkout.Session;

  void sendPurchaseReceiptEmailIfNeeded({
    orderId: order.id,
    userId: order.user_id,
    projectId: order.project_id,
    productSku: order.product_sku,
    amountCents,
    existingMetadata: order.metadata as Json,
    session: sessionForReceipt,
  }).catch((e) => console.error("[webhook] receipt email", e));

  await service.from("admin_audit_logs").insert({
    actor_id: order.user_id,
    action: "order.completed",
    resource_type: "order",
    resource_id: order.id,
    changes: {
      source: "stripe_webhook",
      stripe_session_id: params.stripeCheckoutSessionId,
      payment_intent: params.paymentIntentId,
    } as unknown as Json,
  });
}

function assertMetadataMatchesOrder(
  order: {
    user_id: string;
    project_id: string | null;
    product_sku: string;
  },
  meta: Stripe.Metadata | null | undefined,
): boolean {
  const mUser = metadataString(meta, "user_id");
  const mProject = metadataString(meta, "project_id");
  const mSku = metadataString(meta, "product_sku");
  if (mUser && mUser !== order.user_id) {
    console.error("[webhook] metadata user_id mismatch");
    return false;
  }
  if (mProject && order.project_id && mProject !== order.project_id) {
    console.error("[webhook] metadata project_id mismatch");
    return false;
  }
  if (mSku && mSku !== order.product_sku) {
    console.error("[webhook] metadata product_sku mismatch");
    return false;
  }
  return true;
}

async function markOrderCompletedFromSession(
  session: Stripe.Checkout.Session,
  stripeEventType: string,
): Promise<void> {
  const paid =
    session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (!paid) {
    return;
  }

  const orderId =
    session.metadata?.order_id ??
    (typeof session.client_reference_id === "string" ? session.client_reference_id : null);
  if (!orderId) {
    console.error("[webhook] checkout.session completed missing order_id");
    return;
  }

  const service = createSupabaseServiceRoleClient();
  const { data: order, error: fetchErr } = await service
    .from("orders")
    .select("id, user_id, status, metadata, amount_cents, currency, project_id, product_sku, stripe_checkout_session_id")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    console.error("[webhook] order lookup", fetchErr);
    return;
  }

  if (!assertMetadataMatchesOrder(order, session.metadata)) {
    return;
  }

  if (
    order.stripe_checkout_session_id &&
    order.stripe_checkout_session_id !== session.id
  ) {
    console.error("[webhook] session id mismatch for order", orderId);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const amountTotal =
    typeof session.amount_total === "number" ? session.amount_total : null;

  await finalizeOrderPaid({
    orderId: order.id,
    stripeCheckoutSessionId: session.id,
    paymentIntentId,
    amountCents: amountTotal,
    currency: (session.currency as string) ?? null,
    webhookEvent: {
      type: stripeEventType,
      at: new Date().toISOString(),
      session_id: session.id,
    },
  });
}

async function markOrderCompletedFromPaymentIntent(pi: Stripe.PaymentIntent): Promise<void> {
  if (pi.status !== "succeeded") return;
  const orderId = metadataString(pi.metadata, "order_id");
  if (!orderId) return;

  const service = createSupabaseServiceRoleClient();
  const { data: order, error: fetchErr } = await service
    .from("orders")
    .select("id, user_id, status, metadata, amount_cents, currency, project_id, product_sku, stripe_checkout_session_id")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    console.error("[webhook] payment_intent order lookup", fetchErr);
    return;
  }

  if (!assertMetadataMatchesOrder(order, pi.metadata)) {
    return;
  }

  const sessionId = order.stripe_checkout_session_id ?? "";
  if (!sessionId) {
    console.error("[webhook] payment_intent.succeeded but order missing stripe_checkout_session_id");
    return;
  }

  const amountReceived =
    typeof pi.amount_received === "number" ? pi.amount_received : null;

  await finalizeOrderPaid({
    orderId: order.id,
    stripeCheckoutSessionId: sessionId,
    paymentIntentId: pi.id,
    amountCents: amountReceived,
    currency: (pi.currency as string) ?? null,
    webhookEvent: {
      type: "payment_intent.succeeded",
      at: new Date().toISOString(),
      payment_intent_id: pi.id,
    },
  });
}

async function markOrderFailedFromSession(
  session: Stripe.Checkout.Session,
  reason: string,
  eventType: string,
): Promise<void> {
  const orderId =
    session.metadata?.order_id ??
    (typeof session.client_reference_id === "string" ? session.client_reference_id : null);
  if (!orderId) return;

  const service = createSupabaseServiceRoleClient();
  const { data: order } = await service
    .from("orders")
    .select("id, status, metadata, stripe_checkout_session_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status === "completed") return;

  if (
    order.stripe_checkout_session_id &&
    order.stripe_checkout_session_id !== session.id
  ) {
    console.error("[webhook] failed handler session mismatch", orderId);
    return;
  }

  await service
    .from("orders")
    .update({
      status: "failed",
      metadata: mergeOrderMeta(order.metadata as Json, {
        failure_reason: reason,
        failed_at: new Date().toISOString(),
        event: { type: eventType, at: new Date().toISOString(), session_id: session.id },
      }),
    })
    .eq("id", orderId)
    .in("status", ["pending", "processing"]);
}

export async function processStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await markOrderCompletedFromSession(
        event.data.object as Stripe.Checkout.Session,
        event.type,
      );
      break;
    case "checkout.session.async_payment_succeeded":
      await markOrderCompletedFromSession(
        event.data.object as Stripe.Checkout.Session,
        event.type,
      );
      break;
    case "checkout.session.expired":
      await markOrderFailedFromSession(
        event.data.object as Stripe.Checkout.Session,
        "checkout_session_expired",
        "checkout.session.expired",
      );
      break;
    case "checkout.session.async_payment_failed":
      await markOrderFailedFromSession(
        event.data.object as Stripe.Checkout.Session,
        "async_payment_failed",
        "checkout.session.async_payment_failed",
      );
      break;
    case "payment_intent.succeeded":
      await markOrderCompletedFromPaymentIntent(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      break;
  }
}

export function verifyStripeWebhookSignature(
  rawBody: string | Buffer,
  signature: string | null,
): Stripe.Event {
  if (!serverEnv.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  const stripe = getStripeServer();
  return stripe.webhooks.constructEvent(
    rawBody,
    signature ?? "",
    serverEnv.STRIPE_WEBHOOK_SECRET,
  );
}
