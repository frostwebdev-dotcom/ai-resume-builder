"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Download, Info, Lock, Loader2, AlertCircle } from "lucide-react";

import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import { PDF_UNLOCK_PROJECT_SCOPE_LINE } from "@/lib/billing/monetization-copy";
import { formatUsdFromCents } from "@/lib/billing/format-money";
import { PdfPreviewFidelityNote } from "@/components/resume-preview/pdf-preview-fidelity-note";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROUTES } from "@/lib/constants";
import { RESUME_PDF_SIGNED_URL_TTL_MINUTES } from "@/lib/downloads/resume-pdf-constants";
import { requestResumeDownloadAction, type RequestDownloadResult } from "@/services/downloads/actions";
import { startCheckoutAction } from "@/services/billing/actions";
import { cn } from "@/lib/utils";

type DownloadFailure = Extract<RequestDownloadResult, { ok: false }>;

const CONFIG_CHECKOUT_MESSAGE =
  "Payments are not set up on this environment yet. PDF unlock requires Stripe to be configured on the server. If you are the site owner, add your Stripe keys; otherwise contact support or use the production site.";

type Props = {
  projectId: string;
  /** From server — never trust client-only flags for access */
  canDownload: boolean;
  hasDownloadHistory: boolean;
  /** Server-only: Stripe Checkout is available (avoids a dead “Unlock” CTA). */
  checkoutEnabled: boolean;
  /** URL hint only — never used to grant access; drives retry / pending copy. */
  checkoutNotice?: "success" | "failed" | "cancelled" | "pending" | null;
};

export function ResumeDownloadSection({
  projectId,
  canDownload,
  hasDownloadHistory,
  checkoutEnabled,
  checkoutNotice = null,
}: Props) {
  const [pending, start] = useTransition();
  const [checkoutPending, startCheckout] = useTransition();
  const [downloadIssue, setDownloadIssue] = useState<DownloadFailure | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutConfigError, setCheckoutConfigError] = useState(false);

  const goToCheckout = () => {
    setDownloadIssue(null);
    setCheckoutError(null);
    setCheckoutConfigError(false);
    startCheckout(async () => {
      const res = await startCheckoutAction({
        projectId,
        productSku: "resume_pdf_v1",
      });
      if (!res.ok) {
        if (res.code === "CONFIG") {
          setCheckoutConfigError(true);
          setCheckoutError(null);
        } else {
          setCheckoutConfigError(false);
          setCheckoutError(res.error);
        }
        return;
      }
      window.location.assign(res.url);
    });
  };

  const startDownload = () => {
    setDownloadIssue(null);
    start(async () => {
      const res = await requestResumeDownloadAction({ projectId });
      if (!res.ok) {
        setDownloadIssue({ ok: false, error: res.error, code: res.code });
        return;
      }
      window.location.assign(res.signedUrl);
    });
  };

  if (!canDownload) {
    return (
      <section
        id="resume-export-panel"
        className="rounded-xl border border-border/80 bg-muted/25 p-4 ring-1 ring-foreground/5 sm:p-5"
        aria-labelledby="pdf-locked-heading"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <h2 id="pdf-locked-heading" className="text-subhead text-foreground">
                Export (PDF)
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Preview is free. Pay to download your final PDF.
                </span>{" "}
                Unlock is {formatUsdFromCents(BILLING_PRODUCTS.resume_pdf_v1.amountCents)} once for this
                project (Stripe). {PDF_UNLOCK_PROJECT_SCOPE_LINE}
              </p>
            </div>
          </div>
          {checkoutEnabled ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
              <Button
                type="button"
                size="touch"
                className="w-full justify-center sm:min-w-[12rem]"
                disabled={checkoutPending}
                onClick={goToCheckout}
              >
                {checkoutPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Redirecting…
                  </>
                ) : (
                  <>Unlock PDF — {formatUsdFromCents(BILLING_PRODUCTS.resume_pdf_v1.amountCents)}</>
                )}
              </Button>
              {(checkoutNotice === "failed" ||
                checkoutNotice === "cancelled" ||
                checkoutNotice === "pending" ||
                checkoutNotice === "success") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:min-w-[12rem]"
                  disabled={checkoutPending}
                  onClick={goToCheckout}
                >
                  Try payment again
                </Button>
              )}
              <Link
                href={ROUTES.pricing}
                className="text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:text-right"
              >
                Compare plans
              </Link>
            </div>
          ) : null}
        </div>

        <PdfPreviewFidelityNote className="mt-3" variant="compact" />

        {checkoutEnabled && checkoutNotice === "pending" ? (
          <Alert variant="warning" className="mt-4">
            <Info aria-hidden />
            <AlertTitle>Payment still confirming</AlertTitle>
            <AlertDescription>
              If you completed checkout, wait a minute and refresh this page. Unlock is applied only
              after Stripe notifies our server.
            </AlertDescription>
          </Alert>
        ) : null}

        {!checkoutEnabled ? (
          <Alert variant="info" className="mt-4">
            <Info aria-hidden />
            <AlertTitle>Checkout unavailable in this environment</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{CONFIG_CHECKOUT_MESSAGE}</p>
              <p>
                <Link
                  href={ROUTES.contact}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Contact support
                </Link>{" "}
                if you need help.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <p className="mt-3 text-caption text-muted-foreground">
            After payment, your unlock appears here when the server confirms—refresh if needed.
          </p>
        )}

        {checkoutEnabled && checkoutConfigError ? (
          <Alert variant="info" className="mt-4">
            <Info aria-hidden />
            <AlertTitle>Payments not configured</AlertTitle>
            <AlertDescription>{CONFIG_CHECKOUT_MESSAGE}</AlertDescription>
          </Alert>
        ) : null}

        {checkoutEnabled && checkoutError ? (
          <p className="mt-3 text-sm font-medium text-destructive" role="alert">
            {checkoutError}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      id="resume-export-panel"
      className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 ring-1 ring-primary/10 sm:p-5"
      aria-labelledby="pdf-ready-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Download className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 id="pdf-ready-heading" className="text-subhead text-foreground">
              Export (PDF)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Your resume is ready to download.</span>{" "}
              {hasDownloadHistory
                ? "Your purchase includes re-downloads; each tap builds a fresh PDF from your latest Draft and template."
                : "We generate a print-ready file from the same template and content you see in preview."}
            </p>
            <p className="mt-2 text-caption text-muted-foreground">
              The download link is short-lived (about {RESUME_PDF_SIGNED_URL_TTL_MINUTES} minutes) for
              security—if it expires in your browser, tap download again here.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:max-w-[min(100%,20rem)] sm:flex-row sm:items-center">
        <Button
          type="button"
          size="touch"
          className={cn("w-full min-h-12 justify-center sm:min-w-[11.5rem]")}
          disabled={pending}
          onClick={startDownload}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Preparing PDF…
            </>
          ) : (
            <>
              <Download className="size-4" aria-hidden />
              Download PDF
            </>
          )}
        </Button>
        </div>
      </div>
      <PdfPreviewFidelityNote className="mt-4" variant="compact" />
      {downloadIssue ? (
        <Alert
          variant={downloadIssue.code === "INSUFFICIENT_CONTENT" ? "warning" : "destructive"}
          className="mt-4"
        >
          <AlertCircle aria-hidden />
          <AlertTitle>
            {downloadIssue.code === "INSUFFICIENT_CONTENT"
              ? "Resume needs a bit more content"
              : downloadIssue.code === "RATE_LIMIT"
                ? "Too many download attempts"
                : "Download could not complete"}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{downloadIssue.error}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(downloadIssue.code === "GENERATION_FAILED" || downloadIssue.code === "RATE_LIMIT") && (
                <Button
                  type="button"
                  variant="outline"
                  size="touch"
                  className="w-full sm:w-auto"
                  disabled={pending}
                  onClick={startDownload}
                >
                  Try download again
                </Button>
              )}
              {downloadIssue.code === "INSUFFICIENT_CONTENT" ? (
                <Link
                  href={ROUTES.app.projectBuild(projectId)}
                  className={cn(
                    buttonVariants({ variant: "default", size: "touch" }),
                    "w-full justify-center sm:w-auto",
                  )}
                >
                  Go to Draft
                </Link>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
