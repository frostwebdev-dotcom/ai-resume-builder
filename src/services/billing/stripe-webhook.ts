import "server-only";

import type Stripe from "stripe";

import { getStripeServer } from "@/lib/stripe/server";
import { serverEnv } from "@/lib/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
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

async function markOrderCompletedFromSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.payment_status !== "paid") {
    return;
  }

  const orderId =
    session.metadata?.order_id ??
    (typeof session.client_reference_id === "string" ? session.client_reference_id : null);
  if (!orderId) {
    console.error("[webhook] checkout.session.completed missing order_id");
    return;
  }

  const service = createSupabaseServiceRoleClient();

  const { data: order, error: fetchErr } = await service
    .from("orders")
    .select("id, user_id, status, metadata, amount_cents, currency, project_id, product_sku")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    console.error("[webhook] order lookup", fetchErr);
    return;
  }

  if (order.status === "completed") {
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { data: existingPayment } = await service
    .from("payments")
    .select("id")
    .eq("order_id", order.id)
    .limit(1)
    .maybeSingle();

  const amountCents =
    typeof session.amount_total === "number" ? session.amount_total : order.amount_cents;
  const paidAt = new Date().toISOString();

  if (!existingPayment) {
    const { error: payErr } = await service.from("payments").insert({
      order_id: order.id,
      stripe_payment_intent_id: paymentIntentId,
      amount_cents: amountCents,
      currency: (session.currency as string) ?? order.currency ?? "usd",
      status: "paid",
      paid_at: paidAt,
    });
    if (payErr) {
      console.error("[webhook] payment insert", payErr);
      return;
    }
  }

  const { error: ordErr } = await service
    .from("orders")
    .update({
      status: "completed",
      stripe_checkout_session_id: session.id,
      metadata: mergeOrderMeta(order.metadata as Json, {
        paid_at: paidAt,
        stripe_payment_intent_id: paymentIntentId,
        event: { type: "checkout.session.completed", at: paidAt, session_id: session.id },
      }),
    })
    .eq("id", order.id);

  if (ordErr) {
    console.error("[webhook] order update", ordErr);
    return;
  }

  const receiptAmountCents =
    typeof session.amount_total === "number" ? session.amount_total : order.amount_cents;

  trackServerEvent(ANALYTICS_EVENTS.PAYMENT_SUCCEEDED, {
    product_sku: order.product_sku,
    order_id_prefix: order.id.slice(0, 8),
    amount_cents: receiptAmountCents,
  });

  void sendPurchaseReceiptEmailIfNeeded({
    orderId: order.id,
    userId: order.user_id,
    projectId: order.project_id,
    productSku: order.product_sku,
    amountCents: receiptAmountCents,
    existingMetadata: order.metadata as Json,
    session,
  }).catch((e) => console.error("[webhook] receipt email", e));

  await service.from("admin_audit_logs").insert({
    actor_id: order.user_id,
    action: "order.completed",
    resource_type: "order",
    resource_id: order.id,
    changes: {
      source: "stripe_webhook",
      stripe_session_id: session.id,
      payment_intent: paymentIntentId,
    } as unknown as Json,
  });
}

async function markOrderFailedFromSession(
  session: Stripe.Checkout.Session,
  reason: string,
): Promise<void> {
  const orderId =
    session.metadata?.order_id ??
    (typeof session.client_reference_id === "string" ? session.client_reference_id : null);
  if (!orderId) return;

  const service = createSupabaseServiceRoleClient();
  const { data: order } = await service
    .from("orders")
    .select("id, status, metadata")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status === "completed") return;

  await service
    .from("orders")
    .update({
      status: "failed",
      metadata: mergeOrderMeta(order.metadata as Json, {
        failure_reason: reason,
        failed_at: new Date().toISOString(),
        event: { type: "checkout.session.expired", at: new Date().toISOString() },
      }),
    })
    .eq("id", orderId);
}

export async function processStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await markOrderCompletedFromSession(event.data.object as Stripe.Checkout.Session);
      break;
    case "checkout.session.expired":
      await markOrderFailedFromSession(
        event.data.object as Stripe.Checkout.Session,
        "checkout_session_expired",
      );
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
