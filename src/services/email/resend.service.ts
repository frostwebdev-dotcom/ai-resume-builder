import "server-only";

import { Resend } from "resend";

import { serverEnv } from "@/lib/env";

let client: Resend | null = null;

function getResend(): Resend {
  if (!serverEnv.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  if (!client) {
    client = new Resend(serverEnv.RESEND_API_KEY);
  }
  return client;
}

/**
 * Transactional email helpers — implement templates and calls in a later milestone.
 */
export const emailService = {
  getClient: getResend,
};
