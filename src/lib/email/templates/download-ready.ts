import { escapeHtml } from "@/lib/email/escape-html";
import {
  emailParagraph,
  emailPrimaryButton,
  emailSecondaryButton,
  renderEmailLayout,
} from "@/lib/email/layout";

export function buildDownloadReadyEmail(params: {
  /** Resume / project display name */
  projectTitle: string;
  /** Where they open preview and tap Download PDF */
  previewUrl: string;
  dashboardUrl: string;
}): { html: string; text: string } {
  const title = escapeHtml(params.projectTitle);
  const bodyHtml = `
    ${emailParagraph(`Your print-ready PDF for <strong>${title}</strong> is ready.`)}
    ${emailParagraph(`Open the link below in your browser. You may need to <strong>sign in</strong> with the same account you used to purchase—then use <strong>Download PDF</strong> on the preview page. Download links from the app expire quickly for security; always start from here or your dashboard.`)}
    ${emailPrimaryButton(params.previewUrl, "Open preview & download")}
    ${emailSecondaryButton(params.dashboardUrl, "Open dashboard")}
    ${emailParagraph(`If you already downloaded the file, you can ignore this message.`)}
  `;

  const html = renderEmailLayout({
    previewText: "Your resume PDF is ready.",
    title: "Download ready",
    bodyHtml,
  });

  const text = [
    "Your resume PDF is ready",
    "",
    `Resume: ${params.projectTitle}`,
    "",
    "Open the preview in the app to download. Sign in with the same account you used to purchase.",
    "",
    `Preview & download: ${params.previewUrl}`,
    `Dashboard: ${params.dashboardUrl}`,
    "",
    "If you already downloaded the file, you can ignore this message.",
  ].join("\n");

  return { html, text };
}

export function downloadReadySubject(projectTitle: string): string {
  return `Your PDF is ready · ${projectTitle}`;
}
