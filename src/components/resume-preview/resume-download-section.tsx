"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Download, Info, Lock, Loader2 } from "lucide-react";

import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import { formatUsdFromCents } from "@/lib/billing/format-money";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROUTES } from "@/lib/constants";
import { requestResumeDownloadAction } from "@/services/downloads/actions";
import { startCheckoutAction } from "@/services/billing/actions";
import { cn } from "@/lib/utils";

const CONFIG_CHECKOUT_MESSAGE =
  "Payments are not set up on this environment yet. PDF unlock requires Stripe to be configured on the server. If you are the site owner, add your Stripe keys; otherwise contact support or use the production site.";

type Props = {
  projectId: string;
  /** From server — never trust client-only flags for access */
  canDownload: boolean;
  hasDownloadHistory: boolean;
  /** Server-only: Stripe Checkout is available (avoids a dead “Unlock” CTA). */
  checkoutEnabled: boolean;
};

export function ResumeDownloadSection({
  projectId,
  canDownload,
  hasDownloadHistory,
  checkoutEnabled,
}: Props) {
  const [pending, start] = useTransition();
  const [checkoutPending, startCheckout] = useTransition();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutConfigError, setCheckoutConfigError] = useState(false);

  const goToCheckout = () => {
    setDownloadError(null);
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
    setDownloadError(null);
    start(async () => {
      const res = await requestResumeDownloadAction({ projectId });
      if (!res.ok) {
        setDownloadError(res.error);
        return;
      }
      window.location.assign(res.signedUrl);
    });
  };

  if (!canDownload) {
    return (
      <section
        className="rounded-xl border border-border/80 bg-muted/25 p-4 ring-1 ring-foreground/5 sm:p-5"
        aria-labelledby="pdf-locked-heading"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <Lock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <h2 id="pdf-locked-heading" className="text-subhead text-foreground">
                PDF download
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Preview is free. Unlock export for {formatUsdFromCents(BILLING_PRODUCTS.resume_pdf_v1.amountCents)}{" "}
                — pay once per checkout. Card details stay with Stripe.
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
              <Link
                href={ROUTES.pricing}
                className="text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:text-right"
              >
                Compare plans
              </Link>
            </div>
          ) : null}
        </div>

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
            After payment, Stripe notifies our servers — then your download unlocks here (not from the success page
            alone).
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
      className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 ring-1 ring-primary/10 sm:p-5"
      aria-labelledby="pdf-ready-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Download className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 id="pdf-ready-heading" className="text-subhead text-foreground">
              PDF download
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasDownloadHistory
                ? "Your purchase includes re-downloads. We generate a fresh file from your latest resume content."
                : "Your purchase is on file. Download a print-ready PDF anytime."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="touch"
          className={cn("w-full shrink-0 sm:w-auto")}
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
      {downloadError ? (
        <p className="mt-3 text-sm font-medium text-destructive" role="alert">
          {downloadError}
        </p>
      ) : null}
    </section>
  );
}
