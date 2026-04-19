import { NextResponse } from "next/server";

/**
 * After Supabase email confirmation, many clients (Gmail, Outlook) open links inside an embedded
 * webview or iframe. A plain HTTP redirect to `/app` can fail with
 * "Unsafe attempt to load URL … from frame with URL chrome-error://chromewebdata/" when the
 * embedded context blocks navigation to `localhost` or shows an error page.
 *
 * This returns a same-origin HTML page that sets session cookies, then either navigates the top
 * window or opens the destination in a **new tab** (escapes the email client's iframe).
 */
export function emailConfirmationHandoffResponse(destination: URL): NextResponse {
  const dest = destination.toString();
  const safeJson = JSON.stringify(dest);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>Continue to your resumes</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 22rem; margin: 0 auto; padding: 2.5rem 1.25rem; line-height: 1.5; color: #0a0a0a; }
    h1 { font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem; }
    p { margin: 0 0 1.25rem; color: #525252; font-size: 0.9375rem; }
    #go {
      display: inline-block; padding: 0.65rem 1.35rem; background: #171717; color: #fafafa;
      text-decoration: none; border-radius: 0.5rem; font-weight: 600; font-size: 0.9375rem;
    }
    #go:focus { outline: 2px solid #2563eb; outline-offset: 2px; }
  </style>
</head>
<body>
  <h1>Continue to your account</h1>
  <p>Your email is confirmed. If the app doesn’t open on its own, tap the button — some email apps block automatic redirects.</p>
  <a id="go" href="${escapeHtmlAttribute(dest)}">Continue</a>
  <script>
    (function () {
      var d = ${safeJson};
      function go() {
        try {
          if (window.top !== window.self) {
            var w = window.open(d, "_blank", "noopener,noreferrer");
            if (!w) document.getElementById("go").focus();
          } else {
            window.location.replace(d);
          }
        } catch (e) {
          try {
            window.open(d, "_blank", "noopener,noreferrer");
          } catch (_) {}
        }
      }
      go();
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function escapeHtmlAttribute(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}
