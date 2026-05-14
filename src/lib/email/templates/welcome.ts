import { APP_NAME } from "@/lib/constants";
import {
  emailParagraph,
  emailPrimaryButton,
  emailTextLink,
  renderEmailLayout,
} from "@/lib/email/layout";

export function buildWelcomeEmail(params: {
  dashboardUrl: string;
  supportUrl: string;
}): { html: string; text: string } {
  const dashboard = params.dashboardUrl;
  const bodyHtml = `
    ${emailParagraph(`Thanks for creating an account. Build and preview your resume for free; when you are ready, unlock a print-ready PDF from the project preview (one-time purchase per project).`)}
    ${emailPrimaryButton(dashboard, "Open your dashboard")}
    ${emailParagraph(`Questions? Visit ${emailTextLink(params.supportUrl, "support & contact")}.`)}
    ${emailParagraph(`If you did not sign up, you can ignore this email.`)}
  `;

  const html = renderEmailLayout({
    previewText: "Your account is ready.",
    title: "Welcome",
    bodyHtml,
  });

  const text = [
    `Welcome to ${APP_NAME}`,
    "",
    "Thanks for creating an account. Build and preview for free; unlock a print-ready PDF from project preview when you are ready.",
    "",
    `Dashboard: ${dashboard}`,
    `Support: ${params.supportUrl}`,
    "",
    "If you did not sign up, you can ignore this email.",
  ].join("\n");

  return { html, text };
}

export function welcomeEmailSubject(): string {
  return `Welcome to ${APP_NAME}`;
}
