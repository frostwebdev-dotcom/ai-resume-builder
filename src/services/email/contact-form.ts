import "server-only";

import { ROUTES } from "@/lib/constants";
import { appAbsoluteUrl } from "@/lib/email/app-origin";
import { logTransactionalEmailResult, sendTransactionalEmail } from "@/lib/email/send";
import {
  buildContactFormConfirmationEmail,
  buildContactFormStaffNotificationEmail,
  contactFormConfirmationSubject,
  contactFormStaffSubject,
} from "@/lib/email/templates/contact-form";
import { serverEnv } from "@/lib/env";
import { CONTACT_TOPIC_LABELS, type ContactTopic } from "@/validation/contact";

/**
 * Sends visitor confirmation (and optional staff copy). Never throws.
 * Missing `RESEND_API_KEY` is logged and skipped — form submission still succeeds.
 */
export async function sendContactFormTransactionalEmails(params: {
  visitorEmail: string;
  name: string | null;
  topic: ContactTopic;
  message: string;
}): Promise<void> {
  const topicLabel = CONTACT_TOPIC_LABELS[params.topic];
  const messagePreview = params.message.slice(0, 1200);
  const faqUrl = appAbsoluteUrl(ROUTES.faq);
  const contactUrl = appAbsoluteUrl(ROUTES.contact);

  const { html, text } = buildContactFormConfirmationEmail({
    fromEmail: params.visitorEmail,
    topicLabel,
    messagePreview,
    faqUrl,
    contactUrl,
  });

  const userResult = await sendTransactionalEmail({
    to: params.visitorEmail,
    subject: contactFormConfirmationSubject(),
    html,
    text,
    tags: [
      { name: "category", value: "contact_confirmation" },
      { name: "topic", value: params.topic },
    ],
  });
  logTransactionalEmailResult("contact-form:user", userResult);

  const notify = serverEnv.CONTACT_FORM_NOTIFY_EMAIL?.trim();
  if (!notify) return;

  const nameLine = params.name?.trim() || "—";
  const staff = buildContactFormStaffNotificationEmail({
    fromEmail: params.visitorEmail,
    nameLine,
    topicLabel,
    message: params.message,
    submittedAtIso: new Date().toISOString(),
  });

  const staffResult = await sendTransactionalEmail({
    to: notify,
    subject: contactFormStaffSubject(topicLabel),
    html: staff.html,
    text: staff.text,
    replyTo: [params.visitorEmail],
    tags: [
      { name: "category", value: "contact_staff" },
      { name: "topic", value: params.topic },
    ],
  });
  logTransactionalEmailResult("contact-form:staff", staffResult);
}
