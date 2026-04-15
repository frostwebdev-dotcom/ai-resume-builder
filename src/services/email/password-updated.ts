import "server-only";

import { appAbsoluteUrl } from "@/lib/email/app-origin";
import { sendTransactionalEmail } from "@/lib/email/send";
import {
  buildPasswordUpdatedEmail,
  passwordUpdatedSubject,
} from "@/lib/email/templates/password-updated";
import { ROUTES } from "@/lib/constants";

/**
 * Security notice after a successful password change (Supabase session recovery flow).
 */
export async function sendPasswordUpdatedEmail(to: string): Promise<void> {
  const loginUrl = appAbsoluteUrl(ROUTES.auth.login);
  const { html, text } = buildPasswordUpdatedEmail({ loginUrl });

  const result = await sendTransactionalEmail({
    to,
    subject: passwordUpdatedSubject(),
    html,
    text,
    tags: [{ name: "category", value: "security" }],
  });

  if (result.ok === false) {
    if ("skipped" in result && result.reason === "not_configured") {
      return;
    }
    console.warn("[email] password-updated: send failed");
  }
}
