import "server-only";

import { getEmailFrom, getResendClient } from "@/lib/email/client";
import { serverEnv } from "@/lib/env";

export type TransactionalEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | { ok: false; skipped: true; reason: "not_configured" };

/**
 * Sends via Resend. On failure, logs and returns — callers should not throw to users.
 * When RESEND_API_KEY is unset, skips quietly (local dev).
 */
export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload,
): Promise<SendResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, skipped: true, reason: "not_configured" };
  }

  const from = getEmailFrom();
  const replyTo = serverEnv.EMAIL_REPLY_TO;

  try {
    const { data, error } = await client.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: replyTo ? [replyTo] : undefined,
      tags: payload.tags,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: error.message };
    }
    if (!data?.id) {
      console.error("[email] Resend returned no id");
      return { ok: false, error: "No message id from provider." };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown email error";
    console.error("[email] send failed:", e);
    return { ok: false, error: message };
  }
}
