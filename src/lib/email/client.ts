import "server-only";

import { Resend } from "resend";

import { serverEnv } from "@/lib/env";

let resend: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!serverEnv.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(serverEnv.RESEND_API_KEY);
  }
  return resend;
}

export function isEmailSendingConfigured(): boolean {
  return Boolean(serverEnv.RESEND_API_KEY);
}

/** Default Resend test sender; replace with EMAIL_FROM after domain verification. */
export const DEFAULT_EMAIL_FROM = "AI Resume Builder <onboarding@resend.dev>";

export function getEmailFrom(): string {
  return serverEnv.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
}
