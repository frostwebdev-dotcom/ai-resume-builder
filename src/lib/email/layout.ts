import { escapeHtml } from "@/lib/email/escape-html";

export type EmailLayoutProps = {
  /** Inbox preview line (hidden in body). */
  previewText: string;
  title: string;
  /** Already-escaped HTML fragments (paragraphs, lists). */
  bodyHtml: string;
};

/**
 * Table-based layout for broad client support; single column, readable line length.
 */
export function renderEmailLayout(props: EmailLayoutProps): string {
  const preview = escapeHtml(props.previewText);
  const title = escapeHtml(props.title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding-left: 16px !important; padding-right: 16px !important; }
      .inner { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f4f5;">
    ${preview}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="container" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr>
            <td class="inner" style="padding:32px 28px;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#18181b;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.02em;color:#71717a;text-transform:uppercase;">${title}</p>
              ${props.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #f4f4f5;font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.5;color:#a1a1aa;">
              <p style="margin:0;">You received this message because of activity on ${escapeHtml(
                "AI Resume Builder",
              )}. If it looks unexpected, you can ignore it or contact support via our website.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Primary CTA — table button for Outlook-friendly rendering. */
export function emailPrimaryButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
  <tr>
    <td style="border-radius:6px;background-color:#18181b;">
      <a href="${safeHref}" style="display:inline-block;padding:12px 22px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${safeLabel}</a>
    </td>
  </tr>
</table>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;">${text}</p>`;
}
