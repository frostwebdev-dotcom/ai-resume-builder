"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, Download, Info, Lock, Loader2, AlertCircle } from "lucide-react";

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

const PAYMENT_SETUP_MESSAGE =
  "Payment setup is not complete yet. Please connect Stripe live keys and webhook before accepting real payments.";

const CHECKOUT_TEMPORARILY_UNAVAILABLE_MESSAGE =
  "Checkout is temporarily unavailable. Please contact support.";

const trustPoints = [
  "Secure checkout with Stripe",
  "One-time payment",
  "No subscription",
  "Download after payment",
] as const;

type Props = {
  projectId: string;
  /** From server — never trust client-only flags for access */
  canDownload: boolean;
  hasDownloadHistory: boolean;
  /** Server-only: Stripe Checkout is available (avoids a dead “Unlock” CTA). */
  checkoutEnabled: boolean;
  /** Admin/dev users can see setup guidance; normal users get support-focused copy. */
  showPaymentSetupDetails: boolean;
  /** URL hint only — never used to grant access; drives retry / pending copy. */
  checkoutNotice?: "success" | "failed" | "cancelled" | "pending" | null;
};

export function ResumeDownloadSection({
  projectId,
  canDownload,
  hasDownloadHistory,
  checkoutEnabled,
  showPaymentSetupDetails,
  checkoutNotice = null,
}: Props) {
  const [pending, start] = useTransition();
  const [checkoutPending, startCheckout] = useTransition();
  const [downloadIssue, setDownloadIssue] = useState<DownloadFailure | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutConfigError, setCheckoutConfigError] = useState(false);
  const unlockPrice = formatUsdFromCents(BILLING_PRODUCTS.resume_pdf_v1.amountCents);
  const unavailableMessage = showPaymentSetupDetails
    ? PAYMENT_SETUP_MESSAGE
    : CHECKOUT_TEMPORARILY_UNAVAILABLE_MESSAGE;

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
        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] ring-1 ring-slate-950/5"
        aria-labelledby="pdf-locked-heading"
      >
        <div className="border-b border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-950/10">
              <Lock className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="pdf-locked-heading" className="text-subhead text-foreground">
                Download your final PDF
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Preview is free. Pay once to unlock the final PDF for this resume project.
                </span>{" "}
                {PDF_UNLOCK_PROJECT_SCOPE_LINE}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {checkoutEnabled ? (
            <div className="space-y-2">
              <Button
                type="button"
                size="touch"
                className="h-13 w-full justify-center rounded-xl bg-slate-950 text-base font-semibold shadow-soft hover:bg-slate-800"
                disabled={checkoutPending}
                onClick={goToCheckout}
              >
                {checkoutPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Redirecting…
                  </>
                ) : (
                  <>Unlock PDF Download — {unlockPrice}</>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Secure one-time checkout. No subscription.
              </p>
              {(checkoutNotice === "failed" ||
                checkoutNotice === "cancelled" ||
                checkoutNotice === "pending" ||
                checkoutNotice === "success") && (
                <Button
                  type="button"
                  variant="outline"
                  size="touch"
                  className="w-full"
                  disabled={checkoutPending}
                  onClick={goToCheckout}
                >
                  Try payment again
                </Button>
              )}
            </div>
          ) : null}

          <ul className="grid gap-2" aria-label="PDF checkout trust points">
            {trustPoints.map((point) => (
              <li
                key={point}
                className="flex min-h-10 items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-sm text-slate-700"
              >
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                <span className="font-medium">{point}</span>
              </li>
            ))}
          </ul>

          <PdfPreviewFidelityNote variant="compact" />

          <Link
            href={ROUTES.pricing}
            className="block text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Compare plans
          </Link>
        </div>

        {checkoutEnabled && checkoutNotice === "pending" ? (
          <Alert variant="warning" className="mx-4 mb-4 sm:mx-5 sm:mb-5">
            <Info aria-hidden />
            <AlertTitle>Payment still confirming</AlertTitle>
            <AlertDescription>
              If you completed checkout, wait a minute and refresh this page. Unlock is applied only
              after Stripe notifies our server.
            </AlertDescription>
          </Alert>
        ) : null}

        {!checkoutEnabled ? (
          <Alert variant="info" className="mx-4 mb-4 sm:mx-5 sm:mb-5">
            <Info aria-hidden />
            <AlertTitle>Checkout unavailable</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{unavailableMessage}</p>
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
          <p className="px-4 pb-4 text-caption text-muted-foreground sm:px-5 sm:pb-5">
            After payment, your unlock appears here when the server confirms—refresh if needed.
          </p>
        )}

        {checkoutEnabled && checkoutConfigError ? (
          <Alert variant="info" className="mx-4 mb-4 sm:mx-5 sm:mb-5">
            <Info aria-hidden />
            <AlertTitle>Checkout unavailable</AlertTitle>
            <AlertDescription>{unavailableMessage}</AlertDescription>
          </Alert>
        ) : null}

        {checkoutEnabled && checkoutError ? (
          <p className="px-4 pb-4 text-sm font-medium text-destructive sm:px-5 sm:pb-5" role="alert">
            {checkoutError}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      id="resume-export-panel"
      className="rounded-2xl border border-emerald-500/20 bg-emerald-50/70 p-4 ring-1 ring-emerald-500/10 sm:p-5"
      aria-labelledby="pdf-ready-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Download className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 id="pdf-ready-heading" className="text-subhead text-foreground">
              Download your final PDF
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
