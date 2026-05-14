import "server-only";

import { getEmailFrom, getResendClient } from "@/lib/email/client";
import { serverEnv } from "@/lib/env";

export type TransactionalEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
  /** Overrides default `EMAIL_REPLY_TO` for this message (e.g. staff copy with visitor reply-to). */
  replyTo?: string[];
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | { ok: false; skipped: true; reason: "not_configured" };

/**
 * Logs non-success outcomes for observability. Skipped (no API key) is warn-level.
 */
export function logTransactionalEmailResult(context: string, result: SendResult): void {
  if (result.ok) return;
  if ("skipped" in result && result.reason === "not_configured") {
    console.warn(`[email] ${context}: skipped (RESEND_API_KEY not set)`);
    return;
  }
  const detail = "error" in result ? result.error : "unknown";
  console.error(`[email] ${context}: send failed`, { error: detail });
}

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

  const to = payload.to?.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.warn("[email] invalid or missing recipient; skip send");
    return { ok: false, error: "Invalid recipient address." };
  }

  const from = getEmailFrom();
  const defaultReply = serverEnv.EMAIL_REPLY_TO?.trim();
  const override =
    Array.isArray(payload.replyTo) && payload.replyTo.length > 0
      ? payload.replyTo.map((s) => s.trim()).filter(Boolean)
      : null;
  const replyTo =
    override?.length && override.length > 0
      ? override
      : defaultReply
        ? [defaultReply]
        : undefined;

  try {
    const { data, error } = await client.emails.send({
      from,
      to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: replyTo?.length ? replyTo : undefined,
      tags: payload.tags,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data?.id) {
      return { ok: false, error: "No message id from provider." };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown email error";
    console.error("[email] send failed:", e);
    return { ok: false, error: message };
  }
}
