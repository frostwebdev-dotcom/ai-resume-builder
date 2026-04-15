import { escapeHtml } from "@/lib/email/escape-html";
import { emailParagraph, emailPrimaryButton, renderEmailLayout } from "@/lib/email/layout";

export function buildDownloadReadyEmail(params: {
  projectTitle: string;
  previewUrl: string;
}): { html: string; text: string } {
  const title = escapeHtml(params.projectTitle);
  const bodyHtml = `
    ${emailParagraph(`Your resume PDF for <strong>${title}</strong> is ready. Open the preview to download. Links expire quickly for security, so we always recommend downloading from your account.`)}
    ${emailPrimaryButton(params.previewUrl, "Open preview & download")}
    ${emailParagraph(`If you already downloaded the file, you can disregard this message.`)}
  `;

  const html = renderEmailLayout({
    previewText: "Your PDF is ready to download.",
    title: "Download ready",
    bodyHtml,
  });

  const text = [
    "Your resume PDF is ready",
    "",
    `Project: ${params.projectTitle}`,
    "",
    "Open the preview in the app to download. Links expire quickly for security.",
    "",
    `Preview: ${params.previewUrl}`,
  ].join("\n");

  return { html, text };
}

export function downloadReadySubject(projectTitle: string): string {
  return `Your PDF is ready · ${projectTitle}`;
}
