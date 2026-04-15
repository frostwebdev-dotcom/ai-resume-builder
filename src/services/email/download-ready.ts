import "server-only";

import { appAbsoluteUrl } from "@/lib/email/app-origin";
import { sendTransactionalEmail } from "@/lib/email/send";
import {
  buildDownloadReadyEmail,
  downloadReadySubject,
} from "@/lib/email/templates/download-ready";
import { ROUTES } from "@/lib/constants";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Json } from "@/types/database";

/**
 * Notifies the user that their PDF is ready (first successful generation after purchase).
 * Idempotent via `orders.metadata.download_ready_email_sent_at`.
 */
export async function trySendDownloadReadyEmail(params: {
  userId: string;
  projectId: string;
  projectTitle: string;
  orderId: string;
}): Promise<void> {
  const service = createSupabaseServiceRoleClient();

  const { data: order, error: orderErr } = await service
    .from("orders")
    .select("metadata")
    .eq("id", params.orderId)
    .maybeSingle();

  if (orderErr || !order) {
    console.error("[email] download-ready: order read", orderErr);
    return;
  }

  const meta =
    order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
      ? (order.metadata as Record<string, unknown>)
      : {};
  if (typeof meta.download_ready_email_sent_at === "string") {
    return;
  }

  const { data: userData, error: userErr } = await service.auth.admin.getUserById(params.userId);
  if (userErr || !userData.user?.email) {
    console.error("[email] download-ready: user lookup", userErr);
    return;
  }

  const previewUrl = appAbsoluteUrl(ROUTES.app.projectPreview(params.projectId));
  const { html, text } = buildDownloadReadyEmail({
    projectTitle: params.projectTitle,
    previewUrl,
  });

  const result = await sendTransactionalEmail({
    to: userData.user.email,
    subject: downloadReadySubject(params.projectTitle),
    html,
    text,
    tags: [{ name: "category", value: "download_ready" }],
  });

  if (result.ok === false) {
    if ("skipped" in result && result.reason === "not_configured") {
      return;
    }
    return;
  }

  const nextMeta = {
    ...meta,
    download_ready_email_sent_at: new Date().toISOString(),
    download_ready_resend_email_id: result.id,
  } as Record<string, unknown>;

  const { error: upErr } = await service
    .from("orders")
    .update({ metadata: nextMeta as unknown as Json })
    .eq("id", params.orderId);

  if (upErr) {
    console.error("[email] download-ready: metadata update", upErr);
  }
}
