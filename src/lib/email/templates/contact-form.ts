import "server-only";

import { escapeHtml } from "@/lib/email/escape-html";
import {
  emailParagraph,
  emailPrimaryButton,
  emailTextLink,
  renderEmailLayout,
} from "@/lib/email/layout";
import { APP_NAME } from "@/lib/constants";

export function buildContactFormConfirmationEmail(params: {
  /** Visitor's email (echo only; already validated) */
  fromEmail: string;
  topicLabel: string;
  messagePreview: string;
  faqUrl: string;
  contactUrl: string;
}): { html: string; text: string } {
  const preview = escapeHtml(params.messagePreview);
  const bodyHtml = `
    ${emailParagraph(`Thanks for reaching out to <strong>${escapeHtml(APP_NAME)}</strong>. This message confirms we received your inquiry.`)}
    ${emailParagraph(`<strong>Topic:</strong> ${escapeHtml(params.topicLabel)}`)}
    ${emailParagraph(`<strong>Your email:</strong> ${escapeHtml(params.fromEmail)}`)}
    <p style="margin:0 0 16px;padding:12px 14px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:6px;font-size:14px;line-height:1.55;color:#3f3f46;white-space:pre-wrap;">${preview}</p>
    ${emailParagraph(`We typically reply within 1–2 business days. While you wait, you may find answers in our ${emailTextLink(params.faqUrl, "FAQ")}.`)}
    ${emailPrimaryButton(params.contactUrl, "Contact page")}
    ${emailParagraph(`If you did not submit this form, you can ignore this email.`)}
  `;

  const html = renderEmailLayout({
    previewText: "We received your message.",
    title: "Message received",
    bodyHtml,
  });

  const text = [
    `We received your message — ${APP_NAME}`,
    "",
    `Topic: ${params.topicLabel}`,
    `Your email: ${params.fromEmail}`,
    "",
    "Your message:",
    params.messagePreview,
    "",
    `FAQ: ${params.faqUrl}`,
    `Contact: ${params.contactUrl}`,
  ].join("\n");

  return { html, text };
}

export function contactFormConfirmationSubject(): string {
  return `We received your message · ${APP_NAME}`;
}

export function buildContactFormStaffNotificationEmail(params: {
  fromEmail: string;
  nameLine: string;
  topicLabel: string;
  message: string;
  submittedAtIso: string;
}): { html: string; text: string } {
  const bodyHtml = `
    ${emailParagraph(`<strong>New contact form submission</strong>`)}
    ${emailParagraph(`Time (server): ${escapeHtml(params.submittedAtIso)}`)}
    ${emailParagraph(`Email: ${escapeHtml(params.fromEmail)}`)}
    ${emailParagraph(`Name: ${escapeHtml(params.nameLine)}`)}
    ${emailParagraph(`Topic: ${escapeHtml(params.topicLabel)}`)}
    <p style="margin:0;padding:12px 14px;background-color:#fafafa;border:1px solid #e4e4e7;border-radius:6px;font-size:14px;line-height:1.55;color:#18181b;white-space:pre-wrap;">${escapeHtml(params.message)}</p>
  `;

  const html = renderEmailLayout({
    previewText: "New contact form submission",
    title: "Contact form",
    bodyHtml,
  });

  const text = [
    "Contact form submission",
    "",
    `Time: ${params.submittedAtIso}`,
    `Email: ${params.fromEmail}`,
    `Name: ${params.nameLine}`,
    `Topic: ${params.topicLabel}`,
    "",
    params.message,
  ].join("\n");

  return { html, text };
}

export function contactFormStaffSubject(topicLabel: string): string {
  return `[Contact] ${topicLabel}`;
}
