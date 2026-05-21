import "server-only";

import type Stripe from "stripe";

import { getBillingProduct } from "@/lib/billing/catalog";
import { formatUsdFromCents } from "@/lib/billing/format-money";
import { appAbsoluteUrl } from "@/lib/email/app-origin";
import { getPublicSupportEmailDisplay } from "@/lib/email/support-inbox";
import { logTransactionalEmailResult, sendTransactionalEmail } from "@/lib/email/send";
import {
  buildPurchaseReceiptEmail,
  purchaseReceiptSubject,
} from "@/lib/email/templates/purchase-receipt";
import { ROUTES } from "@/lib/constants";
import { getStripeServer } from "@/lib/stripe/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Json } from "@/types/database";

async function getChargeReceiptUrl(session: Stripe.Checkout.Session): Promise<string | null> {
  const piRef = session.payment_intent;
  if (!piRef) return null;
  const piId = typeof piRef === "string" ? piRef : piRef.id;
  try {
    const stripe = getStripeServer();
    const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
    const ch = pi.latest_charge;
    if (typeof ch === "object" && ch && "receipt_url" in ch && typeof ch.receipt_url === "string") {
      return ch.receipt_url;
    }
  } catch (e) {
    console.error("[email] receipt url lookup", e);
  }
  return null;
}

/**
 * Receipt + purchase confirmation (single message). Idempotent via `orders.metadata.receipt_email_sent_at`.
 * Called after Stripe webhook marks the order paid. Does not throw; failures are logged only.
 */
export async function sendPurchaseReceiptEmailIfNeeded(params: {
  orderId: string;
  userId: string;
  projectId: string | null;
  productSku: string;
  amountCents: number;
  existingMetadata: Json;
  session: Stripe.Checkout.Session;
}): Promise<void> {
  const service = createSupabaseServiceRoleClient();

  const meta =
    params.existingMetadata &&
    typeof params.existingMetadata === "object" &&
    !Array.isArray(params.existingMetadata)
      ? (params.existingMetadata as Record<string, unknown>)
      : {};
  if (typeof meta.receipt_email_sent_at === "string") {
    return;
  }

  const { data: userData, error: userErr } = await service.auth.admin.getUserById(params.userId);
  if (userErr || !userData.user?.email) {
    console.error("[email] receipt: missing user email", userErr);
    return;
  }

  let projectTitle: string | null = null;
  if (params.projectId) {
    const { data: proj } = await service
      .from("resume_projects")
      .select("title")
      .eq("id", params.projectId)
      .eq("user_id", params.userId)
      .maybeSingle();
    projectTitle = proj?.title?.trim() || null;
  }

  const product = getBillingProduct(params.productSku);
  const productLabel = product?.label ?? "Resume purchase";

  const receiptUrl = await getChargeReceiptUrl(params.session);
  const paidAt = new Date(
    (params.session.created ?? Date.now() / 1000) * 1000,
  ).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const previewPath = params.projectId
    ? ROUTES.app.projectPreviewExport(params.projectId)
    : ROUTES.app.root;
  const previewUrl = appAbsoluteUrl(previewPath);
  const dashboardUrl = appAbsoluteUrl(ROUTES.app.root);
  const supportUrl = appAbsoluteUrl(ROUTES.contact);
  const supportEmailDisplay = getPublicSupportEmailDisplay();

  const { html, text } = buildPurchaseReceiptEmail({
    productLabel,
    projectTitle,
    amountFormatted: formatUsdFromCents(params.amountCents),
    paidAtFormatted: paidAt,
    orderIdShort: params.orderId.slice(0, 8),
    receiptUrl,
    previewUrl,
    dashboardUrl,
    supportUrl,
    supportEmailDisplay,
  });

  const result = await sendTransactionalEmail({
    to: userData.user.email,
    subject: purchaseReceiptSubject(productLabel),
    html,
    text,
    tags: [
      { name: "category", value: "receipt" },
      { name: "order_id", value: params.orderId.slice(0, 8) },
    ],
  });

  if (!result.ok) {
    logTransactionalEmailResult("purchase-receipt", result);
    return;
  }

  const nextMeta = {
    ...meta,
    receipt_email_sent_at: new Date().toISOString(),
    receipt_resend_email_id: result.id,
  } as Record<string, unknown>;

  const { error: upErr } = await service
    .from("orders")
    .update({
      metadata: nextMeta as unknown as Json,
    })
    .eq("id", params.orderId);

  if (upErr) {
    console.error("[email] receipt: metadata update", upErr);
  }
}
