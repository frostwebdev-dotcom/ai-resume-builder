import "server-only";

import type Stripe from "stripe";

import { clientEnv } from "@/lib/env";
import { assertCheckoutableProduct } from "@/lib/billing/catalog";
import { ROUTES } from "@/lib/constants";
import { getStripeServer } from "@/lib/stripe/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Json } from "@/types/database";

const APP_URL = clientEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

export type CreateCheckoutSessionResult =
  | { ok: true; url: string }
  | { ok: false; error: string; code: "CONFIG" | "NOT_FOUND" | "VALIDATION" };

/**
 * Creates a pending order, Stripe Checkout Session, and links `stripe_checkout_session_id`.
 * All DB writes use the service role; callers must have already verified auth + project ownership.
 */
export async function createStripeCheckoutSession(params: {
  userId: string;
  projectId: string;
  projectTitle: string;
  productSku: string;
  selectedFormat?: "pdf";
  fileName?: string;
}): Promise<CreateCheckoutSessionResult> {
  let stripe: Stripe;
  try {
    stripe = getStripeServer();
  } catch {
    return { ok: false, error: "Payments are not configured.", code: "CONFIG" };
  }

  const product = assertCheckoutableProduct(params.productSku);

  const service = createSupabaseServiceRoleClient();

  const { data: inserted, error: insErr } = await service
    .from("orders")
    .insert({
      user_id: params.userId,
      project_id: params.projectId,
      product_sku: product.sku,
      amount_cents: product.amountCents,
      currency: product.currency,
      status: "pending",
      metadata: {
        project_title: params.projectTitle,
        created_via: "checkout_session_v1",
        selected_format: params.selectedFormat ?? "pdf",
        ...(params.fileName ? { requested_file_name: params.fileName } : {}),
      } as unknown as Json,
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    console.error("[checkout] order insert", insErr);
    return { ok: false, error: "Could not start checkout.", code: "VALIDATION" };
  }

  const orderId = inserted.id;

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: orderId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: product.currency,
              unit_amount: product.amountCents,
              product_data: {
                name: product.label,
                description: product.description,
                metadata: {
                  sku: product.sku,
                  category: product.category,
                },
              },
            },
          },
        ],
        success_url: `${APP_URL}${ROUTES.app.projectPaymentSuccess(params.projectId)}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}${ROUTES.app.projectPaymentCancelled(params.projectId)}`,
        metadata: {
          order_id: orderId,
          user_id: params.userId,
          project_id: params.projectId,
          product_sku: product.sku,
          selected_format: params.selectedFormat ?? "pdf",
          ...(params.fileName ? { requested_file_name: params.fileName } : {}),
        },
        payment_intent_data: {
          metadata: {
            order_id: orderId,
            user_id: params.userId,
            project_id: params.projectId,
            product_sku: product.sku,
            selected_format: params.selectedFormat ?? "pdf",
            ...(params.fileName ? { requested_file_name: params.fileName } : {}),
          },
        },
      },
      { idempotencyKey: `checkout-session-${orderId}` },
    );

    if (!session.url) {
      throw new Error("Checkout session missing redirect URL.");
    }

    const { data: prevRow } = await service
      .from("orders")
      .select("metadata")
      .eq("id", orderId)
      .single();

    const prevMeta =
      prevRow?.metadata &&
      typeof prevRow.metadata === "object" &&
      !Array.isArray(prevRow.metadata)
        ? (prevRow.metadata as Record<string, unknown>)
        : {};

    const { error: upErr } = await service
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        status: "processing",
        metadata: {
          ...prevMeta,
          project_title: params.projectTitle,
          created_via: "checkout_session_v1",
          checkout_created_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
          selected_format: params.selectedFormat ?? "pdf",
          ...(params.fileName ? { requested_file_name: params.fileName } : {}),
        } as unknown as Json,
      })
      .eq("id", orderId)
      .eq("user_id", params.userId);

    if (upErr) {
      console.error("[checkout] order session link", upErr);
      throw new Error(upErr.message);
    }

    return { ok: true, url: session.url };
  } catch (e) {
    await service.from("orders").delete().eq("id", orderId);
    console.error("[checkout] stripe", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Checkout failed.",
      code: "VALIDATION",
    };
  }
}
