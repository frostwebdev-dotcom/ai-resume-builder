import { APP_NAME } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape-html";
import {
  emailParagraph,
  emailPrimaryButton,
  emailSecondaryButton,
  emailTextLink,
  renderEmailLayout,
} from "@/lib/email/layout";

export function buildPurchaseReceiptEmail(params: {
  productLabel: string;
  /** Resume project title when purchase is tied to a project */
  projectTitle?: string | null;
  amountFormatted: string;
  paidAtFormatted: string;
  orderIdShort: string;
  receiptUrl?: string | null;
  /** Primary: preview / download flow */
  previewUrl: string;
  dashboardUrl: string;
  supportUrl: string;
  /** Shown in footer line when set (e.g. public support inbox) */
  supportEmailDisplay?: string | null;
}): { html: string; text: string } {
  const receiptLine = params.receiptUrl
    ? `<p style="margin:0 0 12px;"><a href="${escapeHtml(params.receiptUrl)}" style="color:#18181b;font-weight:600;">View Stripe receipt</a> <span style="color:#71717a;">(hosted by our payment provider)</span></p>`
    : "";

  const projectRow =
    params.projectTitle && params.projectTitle.trim().length > 0
      ? `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;color:#52525b;font-size:14px;">Resume project</td>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-weight:600;color:#18181b;">${escapeHtml(params.projectTitle.trim())}</td>
      </tr>`
      : "";

  const supportHint = params.supportEmailDisplay
    ? ` For fastest help, reply from the email on your account or write to ${escapeHtml(params.supportEmailDisplay)}.`
    : "";

  const bodyHtml = `
    ${emailParagraph(`Your payment was successful. This email confirms your purchase and serves as a receipt.`)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border-collapse:collapse;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;color:#52525b;font-size:14px;">Product</td>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-weight:600;color:#18181b;">${escapeHtml(params.productLabel)}</td>
      </tr>
      ${projectRow}
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;color:#52525b;font-size:14px;">Amount paid</td>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-weight:600;color:#18181b;">${escapeHtml(params.amountFormatted)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;color:#52525b;font-size:14px;">Date</td>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;color:#18181b;">${escapeHtml(params.paidAtFormatted)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#52525b;font-size:14px;">Order reference</td>
        <td style="padding:10px 0;text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13px;color:#18181b;">${escapeHtml(params.orderIdShort)}</td>
      </tr>
    </table>
    ${receiptLine}
    ${emailParagraph(`Open your project preview to generate and download your PDF (sign in with the same account you used at checkout).`)}
    ${emailPrimaryButton(params.previewUrl, "Open preview & download")}
    ${emailSecondaryButton(params.dashboardUrl, "Open dashboard")}
    ${emailParagraph(`Questions or billing issues? Visit ${emailTextLink(params.supportUrl, "support & contact")}.${supportHint}`)}
  `;

  const html = renderEmailLayout({
    previewText: `Receipt for ${params.productLabel}`,
    title: "Purchase confirmed",
    bodyHtml,
  });

  const text = [
    `Purchase confirmation — ${APP_NAME}`,
    "",
    "Your payment was successful. This message confirms your purchase and serves as a receipt.",
    "",
    `Product: ${params.productLabel}`,
    params.projectTitle?.trim() ? `Resume project: ${params.projectTitle.trim()}` : "",
    `Amount paid: ${params.amountFormatted}`,
    `Date: ${params.paidAtFormatted}`,
    `Order reference: ${params.orderIdShort}`,
    params.receiptUrl ? `Stripe receipt: ${params.receiptUrl}` : "",
    "",
    "Download your PDF from the project preview (sign in required):",
    params.previewUrl,
    "",
    `Dashboard: ${params.dashboardUrl}`,
    "",
    `Support: ${params.supportUrl}`,
    params.supportEmailDisplay ? `Public contact: ${params.supportEmailDisplay}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

export function purchaseReceiptSubject(productLabel: string): string {
  return `Purchase confirmed · ${productLabel}`;
}
