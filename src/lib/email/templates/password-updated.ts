import { appAbsoluteUrl } from "@/lib/email/app-origin";
import { emailParagraph, emailPrimaryButton, renderEmailLayout } from "@/lib/email/layout";
export function buildPasswordUpdatedEmail(params: { loginUrl: string }): { html: string; text: string } {
  const bodyHtml = `
    ${emailParagraph(`The password for your AI Resume Builder account was just changed.`)}
    ${emailParagraph(`If you made this change, no further action is needed.`)}
    ${emailParagraph(`If you did not change your password, reset it immediately and consider reviewing your email account security.`)}
    ${emailPrimaryButton(params.loginUrl, "Sign in")}
  `;

  const html = renderEmailLayout({
    previewText: "Your password was updated.",
    title: "Password updated",
    bodyHtml,
  });

  const text = [
    "Password updated — AI Resume Builder",
    "",
    "The password for your account was just changed.",
    "",
    "If you made this change, no further action is needed.",
    "If you did not change your password, reset it immediately.",
    "",
    `Sign in: ${params.loginUrl}`,
  ].join("\n");

  return { html, text };
}

export function passwordUpdatedSubject(): string {
  return "Your password was updated";
}
