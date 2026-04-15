import { escapeHtml } from "@/lib/email/escape-html";
import { emailParagraph, emailPrimaryButton, renderEmailLayout } from "@/lib/email/layout";

export function buildPurchaseReceiptEmail(params: {
  productLabel: string;
  amountFormatted: string;
  paidAtFormatted: string;
  orderIdShort: string;
  receiptUrl?: string | null;
  previewUrl: string;
}): { html: string; text: string } {
  const receiptLine = params.receiptUrl
    ? `<p style="margin:0 0 12px;"><a href="${escapeHtml(params.receiptUrl)}" style="color:#18181b;font-weight:600;">View Stripe receipt</a> <span style="color:#71717a;">(hosted by our payment provider)</span></p>`
    : "";

  const bodyHtml = `
    ${emailParagraph(`Your payment was successful. This email confirms your purchase and serves as a receipt.`)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border-collapse:collapse;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;color:#52525b;font-size:14px;">Item</td>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-weight:600;color:#18181b;">${escapeHtml(params.productLabel)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;color:#52525b;font-size:14px;">Amount</td>
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
    ${emailParagraph(`You can download your resume PDF from the project preview whenever you are ready.`)}
    ${emailPrimaryButton(params.previewUrl, "Go to project preview")}
  `;

  const html = renderEmailLayout({
    previewText: `Receipt for ${params.productLabel}`,
    title: "Receipt & confirmation",
    bodyHtml,
  });

  const text = [
    "Receipt & purchase confirmation — AI Resume Builder",
    "",
    "Your payment was successful. This message confirms your purchase and serves as a receipt.",
    "",
    `Item: ${params.productLabel}`,
    `Amount: ${params.amountFormatted}`,
    `Date: ${params.paidAtFormatted}`,
    `Order reference: ${params.orderIdShort}`,
    params.receiptUrl ? `Stripe receipt: ${params.receiptUrl}` : "",
    "",
    "Download your resume PDF from the project preview when you are ready.",
    `Preview: ${params.previewUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text };
}

export function purchaseReceiptSubject(productLabel: string): string {
  return `Receipt · ${productLabel}`;
}
