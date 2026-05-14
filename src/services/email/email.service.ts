import "server-only";

import { getEmailFrom, isEmailSendingConfigured } from "@/lib/email/client";
import {
  logTransactionalEmailResult,
  sendTransactionalEmail,
  type SendResult,
  type TransactionalEmailPayload,
} from "@/lib/email/send";

/**
 * Central entry for server-side transactional email (Resend).
 * API key and `EMAIL_FROM` stay server-only — never import this module from client components.
 */
export const emailService = {
  isConfigured: isEmailSendingConfigured,
  /** Resolved From header (`EMAIL_FROM` or Resend onboarding default). */
  getFrom: getEmailFrom,
  sendTransactional: sendTransactionalEmail,
  logSendResult: logTransactionalEmailResult,
};

export type { SendResult, TransactionalEmailPayload };
