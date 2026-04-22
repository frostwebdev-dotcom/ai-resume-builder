import { APP_NAME } from "@/lib/constants";
import { emailParagraph, emailPrimaryButton, renderEmailLayout } from "@/lib/email/layout";
export function buildWelcomeEmail(params: { dashboardUrl: string }): { html: string; text: string } {
  const dashboard = params.dashboardUrl;
  const bodyHtml = `
    ${emailParagraph(`Thanks for creating an account. You can build and preview your resume for free; when you are ready, you can unlock a print-ready PDF from the preview screen.`)}
    ${emailPrimaryButton(dashboard, "Open your dashboard")}
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
    "Thanks for creating an account. You can build and preview your resume for free; when you are ready, you can unlock a print-ready PDF from the preview screen.",
    "",
    `Open your dashboard: ${dashboard}`,
    "",
    "If you did not sign up, you can ignore this email.",
  ].join("\n");

  return { html, text };
}

export function welcomeEmailSubject(): string {
  return `Welcome to ${APP_NAME}`;
}
