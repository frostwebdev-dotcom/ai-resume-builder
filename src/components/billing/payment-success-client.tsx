"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2, RefreshCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { requestResumeDownloadAction } from "@/services/downloads/actions";

type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "not_found";
type DownloadState = "idle" | "preparing" | "ready" | "error";

type Props = {
  projectId: string;
  projectTitle: string;
  sessionId: string | undefined;
  initialStatus: PaymentStatus;
};

const POLL_MS = 2500;
const TIMEOUT_MS = 30000;

async function fetchPaymentStatus(projectId: string, sessionId: string): Promise<PaymentStatus> {
  const params = new URLSearchParams({ session_id: sessionId });
  const response = await fetch(`/api/projects/${projectId}/payment-status?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const json = (await response.json().catch(() => null)) as { status?: PaymentStatus } | null;
  return json?.status ?? "not_found";
}

export function PaymentSuccessClient({
  projectId,
  projectTitle,
  sessionId,
  initialStatus,
}: Props) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialStatus);
  const [timedOut, setTimedOut] = useState(false);
  const [checking, setChecking] = useState(initialStatus === "pending");
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const verifiedTracked = useRef(initialStatus === "paid");
  const delayedTracked = useRef(false);

  const projectIdPrefix = useMemo(() => projectId.slice(0, 8), [projectId]);

  const checkPayment = useCallback(
    async (mode: "manual" | "poll") => {
      if (!sessionId) {
        setPaymentStatus("not_found");
        setChecking(false);
        return;
      }

      setError(null);
      setChecking(true);
      if (mode === "manual") {
        trackClientEvent(ANALYTICS_EVENTS.PAYMENT_VERIFICATION_STARTED, {
          project_id_prefix: projectIdPrefix,
          mode,
        });
      }

      try {
        const next = await fetchPaymentStatus(projectId, sessionId);
        setPaymentStatus(next);
        if (next === "paid" && !verifiedTracked.current) {
          verifiedTracked.current = true;
          trackClientEvent(ANALYTICS_EVENTS.PAYMENT_VERIFIED, {
            project_id_prefix: projectIdPrefix,
          });
        }
        if (next !== "pending") {
          setTimedOut(false);
        }
      } catch {
        setPaymentStatus("not_found");
        setError("Please try again or contact support if you believe payment was completed.");
      } finally {
        setChecking(false);
      }
    },
    [projectId, projectIdPrefix, sessionId],
  );

  useEffect(() => {
    trackClientEvent(ANALYTICS_EVENTS.PAYMENT_SUCCESS_PAGE_VIEWED, {
      project_id_prefix: projectIdPrefix,
    });
    trackClientEvent(ANALYTICS_EVENTS.PAYMENT_VERIFICATION_STARTED, {
      project_id_prefix: projectIdPrefix,
      mode: "initial",
    });
    if (initialStatus === "paid" && !verifiedTracked.current) {
      verifiedTracked.current = true;
      trackClientEvent(ANALYTICS_EVENTS.PAYMENT_VERIFIED, {
        project_id_prefix: projectIdPrefix,
      });
    }
  }, [initialStatus, projectIdPrefix]);

  useEffect(() => {
    if (paymentStatus !== "pending" || !sessionId || timedOut) return;

    let active = true;
    const startedAt = Date.now();

    const interval = window.setInterval(() => {
      if (!active) return;
      if (Date.now() - startedAt >= TIMEOUT_MS) {
        window.clearInterval(interval);
        setTimedOut(true);
        setChecking(false);
        if (!delayedTracked.current) {
          delayedTracked.current = true;
          trackClientEvent(ANALYTICS_EVENTS.PAYMENT_VERIFICATION_DELAYED, {
            project_id_prefix: projectIdPrefix,
          });
        }
        return;
      }
      void checkPayment("poll");
    }, POLL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [checkPayment, paymentStatus, projectIdPrefix, sessionId, timedOut]);

  async function preparePdf() {
    setError(null);
    setDownloadState("preparing");
    trackClientEvent(ANALYTICS_EVENTS.PDF_DOWNLOAD_CLICKED, {
      project_id_prefix: projectIdPrefix,
    });
    trackClientEvent(ANALYTICS_EVENTS.PDF_PREPARE_STARTED, {
      project_id_prefix: projectIdPrefix,
    });

    const result = await requestResumeDownloadAction({ projectId });
    if (!result.ok) {
      setDownloadState("error");
      setError(result.error);
      return;
    }

    setDownloadUrl(result.signedUrl);
    setDownloadState("ready");
    trackClientEvent(ANALYTICS_EVENTS.PDF_DOWNLOAD_COMPLETED, {
      project_id_prefix: projectIdPrefix,
    });
    window.location.assign(result.signedUrl);
  }

  function downloadAgain() {
    if (!downloadUrl) {
      void preparePdf();
      return;
    }
    trackClientEvent(ANALYTICS_EVENTS.PDF_DOWNLOAD_CLICKED, {
      project_id_prefix: projectIdPrefix,
      retry: true,
    });
    window.location.assign(downloadUrl);
  }

  const buildHref = ROUTES.app.projectBuild(projectId);
  const viewHref = ROUTES.app.projectPreviewExport(projectId);

  const content =
    downloadState === "preparing"
      ? {
          icon: <Loader2 className="size-7 animate-spin text-slate-950" aria-hidden />,
          title: "Preparing your resume PDF...",
          message: "This usually takes a few seconds.",
          tone: "neutral" as const,
        }
      : downloadState === "ready"
        ? {
            icon: <CheckCircle2 className="size-7 text-emerald-600" aria-hidden />,
            title: "Your resume is ready",
            message: "Your PDF is ready to download.",
            tone: "success" as const,
          }
        : paymentStatus === "paid"
          ? {
              icon: <CheckCircle2 className="size-7 text-emerald-600" aria-hidden />,
              title: "Payment confirmed",
              message: "Your resume PDF is unlocked and ready to download.",
              tone: "success" as const,
            }
          : paymentStatus === "pending" && timedOut
            ? {
                icon: <RefreshCcw className="size-7 text-amber-600" aria-hidden />,
                title: "Still confirming your payment",
                message:
                  "Your payment may still be processing. Please click Check again or contact support.",
                tone: "warning" as const,
              }
            : paymentStatus === "pending"
              ? {
                  icon: <Loader2 className="size-7 animate-spin text-slate-950" aria-hidden />,
                  title: "Confirming your payment...",
                  message: checking
                    ? "This usually takes a few seconds. Please do not refresh."
                    : "Still confirming your payment. This can take a moment.",
                  tone: "neutral" as const,
                }
              : {
                  icon: <AlertCircle className="size-7 text-destructive" aria-hidden />,
                  title: "We could not verify your payment yet",
                  message:
                    error ??
                    "Please try again or contact support if you believe payment was completed.",
                  tone: "error" as const,
                };

  const canDownload = paymentStatus === "paid";

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
        <div
          className={cn(
            "border-b px-5 py-6 text-center sm:px-8 sm:py-8",
            content.tone === "success"
              ? "border-emerald-100 bg-emerald-50/70"
              : content.tone === "warning"
                ? "border-amber-100 bg-amber-50/70"
                : content.tone === "error"
                  ? "border-red-100 bg-red-50/70"
                  : "border-slate-200 bg-slate-50",
          )}
        >
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-950/5">
            {content.icon}
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
            {content.title}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-slate-600">
            {content.message}
          </p>
          <p className="mt-4 text-sm font-medium text-slate-700">
            {projectTitle}
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-8 sm:py-7">
          {canDownload ? (
            <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50 p-4">
              <p className="text-sm font-medium leading-relaxed text-emerald-950">
                Secure checkout completed with Stripe. No subscription. One-time purchase.
              </p>
            </div>
          ) : null}

          {error && paymentStatus === "paid" ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" aria-hidden />
              <AlertTitle>Download failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {downloadState === "ready" ? (
            <p className="text-center text-sm text-slate-500">
              If the download does not start, click the button again.
            </p>
          ) : null}

          <div className="grid gap-3">
            {canDownload ? (
              <Button
                type="button"
                size="touch"
                className="h-12 bg-slate-950 text-base font-semibold text-white hover:bg-slate-800"
                disabled={downloadState === "preparing"}
                onClick={() => {
                  if (downloadState === "ready") downloadAgain();
                  else void preparePdf();
                }}
              >
                {downloadState === "preparing" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Preparing PDF...
                  </>
                ) : (
                  <>
                    <Download className="size-4" aria-hidden />
                    Download PDF
                  </>
                )}
              </Button>
            ) : null}

            {paymentStatus === "pending" && timedOut ? (
              <Button
                type="button"
                size="touch"
                variant="outline"
                disabled={checking}
                onClick={() => {
                  setTimedOut(false);
                  void checkPayment("manual");
                }}
              >
                {checking ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Checking...
                  </>
                ) : (
                  "Check again"
                )}
              </Button>
            ) : null}

            {paymentStatus === "failed" || paymentStatus === "not_found" || paymentStatus === "cancelled" ? (
              <Button
                type="button"
                size="touch"
                variant="outline"
                disabled={checking}
                onClick={() => void checkPayment("manual")}
              >
                {checking ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Checking...
                  </>
                ) : (
                  "Check again"
                )}
              </Button>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={buildHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "touch" }),
                  "w-full min-w-0 whitespace-normal px-3 text-center leading-snug",
                )}
              >
                Back to editor
              </Link>
              <Link
                href={viewHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "touch" }),
                  "w-full min-w-0 whitespace-normal px-3 text-center leading-snug",
                )}
              >
                View resume
              </Link>
              <Link
                href={ROUTES.create}
                className={cn(
                  buttonVariants({ variant: "outline", size: "touch" }),
                  "w-full min-w-0 whitespace-normal px-3 text-center leading-snug sm:col-span-2",
                )}
              >
                Create another resume
              </Link>
            </div>

            {!canDownload ? (
              <Link
                href={ROUTES.contact}
                className={cn(buttonVariants({ variant: "ghost", size: "touch" }), "w-full")}
              >
                Contact support
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
