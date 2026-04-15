import { NextResponse } from "next/server";

import {
  processStripeWebhookEvent,
  verifyStripeWebhookSignature,
} from "@/services/billing/stripe-webhook";

export const runtime = "nodejs";

/**
 * Stripe webhook — raw body required for signature verification.
 * Never use JSON body parser before `constructEvent`.
 *
 * - Signature / payload errors → 400 (Stripe will not retry invalid deliveries).
 * - Handler failures after verification → 500 (Stripe retries with backoff).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: ReturnType<typeof verifyStripeWebhookSignature>;
  try {
    event = verifyStripeWebhookSignature(rawBody, signature);
  } catch (e) {
    console.error("[stripe webhook] verify", e);
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production") {
    console.info("[stripe webhook]", JSON.stringify({ id: event.id, type: event.type }));
  }

  try {
    await processStripeWebhookEvent(event);
  } catch (e) {
    console.error("[stripe webhook] process", event.id, e);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
