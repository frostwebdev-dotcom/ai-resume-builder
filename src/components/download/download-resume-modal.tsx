"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, Loader2, Lock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { BILLING_PRODUCTS } from "@/lib/billing/catalog";
import { formatUsdFromCents } from "@/lib/billing/format-money";
import { cn } from "@/lib/utils";
import { startCheckoutAction } from "@/services/billing/actions";
import { requestResumeDownloadAction } from "@/services/downloads/actions";

type DownloadFormat = "pdf" | "docx" | "txt";
type PendingState = "checkout" | "download" | null;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultFileName: string;
  canDownload: boolean;
  checkoutEnabled: boolean;
  showPaymentSetupDetails: boolean;
};

const trustPoints = [
  "Secure checkout with Stripe",
  "One-time payment",
  "No subscription",
  "Download after payment",
] as const;

const formats: Array<{
  id: DownloadFormat;
  label: string;
  badge: string;
  disabled?: boolean;
}> = [
  { id: "pdf", label: "Adobe PDF (.pdf)", badge: "Recommended" },
  { id: "docx", label: "MS Word Document (.docx)", badge: "Coming soon", disabled: true },
  { id: "txt", label: "Plain Text (.txt)", badge: "Coming soon", disabled: true },
];

const PAYMENT_SETUP_MESSAGE =
  "Payment setup is not complete yet. Please connect Stripe live keys and webhook before accepting real payments.";

const CHECKOUT_UNAVAILABLE_MESSAGE =
  "Checkout is temporarily unavailable. Please contact support.";

function normalizeFileName(raw: string): string {
  return raw
    .replace(/\.(pdf|docx|txt)$/i, "")
    .replace(/[^\p{L}\p{N} _-]+/gu, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, 120);
}

function finalFileName(raw: string): string {
  const normalized = normalizeFileName(raw).trim();
  return normalized || "Resume";
}

export function DownloadResumeModal({
  open,
  onOpenChange,
  projectId,
  defaultFileName,
  canDownload,
  checkoutEnabled,
  showPaymentSetupDetails,
}: Props) {
  const [format, setFormat] = useState<DownloadFormat>("pdf");
  const [fileName, setFileName] = useState(() => finalFileName(defaultFileName));
  const [pending, setPending] = useState<PendingState>(null);
  const [error, setError] = useState<string | null>(null);
  const unavailableMessage = showPaymentSetupDetails
    ? PAYMENT_SETUP_MESSAGE
    : CHECKOUT_UNAVAILABLE_MESSAGE;
  const price = formatUsdFromCents(BILLING_PRODUCTS.resume_pdf_v1.amountCents);
  const cleanFileName = useMemo(() => finalFileName(fileName), [fileName]);

  function handleFormatSelect(next: DownloadFormat) {
    const option = formats.find((f) => f.id === next);
    if (!option || option.disabled) return;
    setFormat(next);
    trackClientEvent(ANALYTICS_EVENTS.DOWNLOAD_FORMAT_SELECTED, {
      format: next,
      project_id_prefix: projectId.slice(0, 8),
    });
  }

  async function downloadPdf() {
    setError(null);
    setPending("download");
    trackClientEvent(ANALYTICS_EVENTS.PAID_PDF_DOWNLOAD_CLICKED, {
      project_id_prefix: projectId.slice(0, 8),
      format,
    });
    trackClientEvent(ANALYTICS_EVENTS.PDF_DOWNLOAD_STARTED, {
      project_id_prefix: projectId.slice(0, 8),
      format,
    });
    const result = await requestResumeDownloadAction({
      projectId,
      fileName: cleanFileName,
    });
    setPending(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    trackClientEvent(ANALYTICS_EVENTS.PDF_DOWNLOAD_COMPLETED, {
      project_id_prefix: projectId.slice(0, 8),
      format,
    });
    trackClientEvent(ANALYTICS_EVENTS.PAID_PDF_DOWNLOAD_COMPLETED, {
      project_id_prefix: projectId.slice(0, 8),
      format,
    });
    window.location.assign(result.signedUrl);
  }

  async function continueToCheckout() {
    if (!checkoutEnabled) {
      trackClientEvent(ANALYTICS_EVENTS.CHECKOUT_UNAVAILABLE, {
        project_id_prefix: projectId.slice(0, 8),
      });
      setError(unavailableMessage);
      return;
    }

    setError(null);
    setPending("checkout");
    trackClientEvent(ANALYTICS_EVENTS.CHECKOUT_STARTED, {
      product_sku: "resume_pdf_v1",
      selected_format: format,
      entry: "download_resume_modal",
    });
    const result = await startCheckoutAction({
      projectId,
      productSku: "resume_pdf_v1",
      selectedFormat: "pdf",
      fileName: cleanFileName,
    });
    setPending(null);

    if (!result.ok) {
      if (result.code === "CONFIG") {
        trackClientEvent(ANALYTICS_EVENTS.CHECKOUT_UNAVAILABLE, {
          project_id_prefix: projectId.slice(0, 8),
        });
        setError(unavailableMessage);
        return;
      }
      setError(result.error);
      return;
    }

    window.location.assign(result.url);
  }

  const primaryLabel = canDownload
    ? "Download PDF"
    : `Continue to secure checkout — ${price}`;
  const primaryLabelMobile = canDownload ? "Download PDF" : `Continue — ${price}`;
  const primaryPendingLabel =
    pending === "download"
      ? "Preparing PDF..."
      : pending === "checkout"
        ? "Starting checkout..."
        : primaryLabel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,44rem)] w-full max-w-[calc(100%-1rem)] overflow-y-auto bg-white p-0 text-slate-950 shadow-2xl sm:max-w-lg">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
              Download resume
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-600">
              Choose your file format and unlock your final resume download.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <section aria-labelledby="download-format-heading" className="space-y-3">
            <h3 id="download-format-heading" className="text-sm font-semibold text-slate-950">
              File format
            </h3>
            <div className="grid gap-2">
              {formats.map((option) => {
                const selected = option.id === format;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={option.disabled}
                    aria-pressed={selected}
                    onClick={() => handleFormatSelect(option.id)}
                    className={cn(
                      "flex min-h-14 items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                      selected
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
                      option.disabled && "cursor-not-allowed opacity-55 hover:border-slate-200 hover:bg-white",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border",
                          selected ? "border-white" : "border-slate-300",
                        )}
                        aria-hidden
                      >
                        {selected ? <span className="size-2.5 rounded-full bg-white" /> : null}
                      </span>
                      <span className="min-w-0 font-medium">{option.label}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em]",
                        selected
                          ? "bg-white/15 text-white"
                          : option.disabled
                            ? "bg-slate-100 text-slate-500"
                            : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {option.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <label htmlFor="resume-download-name" className="text-sm font-semibold text-slate-950">
              Resume name
            </label>
            <input
              id="resume-download-name"
              value={fileName}
              onChange={(e) => setFileName(normalizeFileName(e.currentTarget.value))}
              onBlur={() => setFileName(cleanFileName)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70"
              placeholder="Resume"
              autoComplete="off"
            />
            <p className="text-xs text-slate-500">
              Tip: Use a clear name like John Smith Resume.
            </p>
          </section>

          {canDownload ? (
            <div className="rounded-xl border border-emerald-600/20 bg-emerald-50 p-3">
              <div className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
                <p className="text-sm font-medium text-emerald-950">
                  Your PDF export is unlocked. Preparing your download will not charge you again.
                </p>
              </div>
            </div>
          ) : (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex gap-2">
                <Lock className="mt-0.5 size-4 shrink-0 text-slate-600" aria-hidden />
                <p className="text-sm font-medium leading-relaxed text-slate-800">
                  Preview is free. Pay once to unlock the final PDF download for this resume.
                </p>
              </div>
              <ul className="grid gap-2 text-sm text-slate-600">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {error ? (
            <Alert variant="destructive">
              <FileText className="size-4" aria-hidden />
              <AlertTitle>Could not continue</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter className="sticky bottom-0 bg-white/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] backdrop-blur sm:px-6">
          <Button
            type="button"
            variant="outline"
            size="touch"
            disabled={pending !== null}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="touch"
            className="h-12 whitespace-normal bg-slate-950 text-center text-base font-semibold leading-snug text-white hover:bg-slate-800"
            disabled={pending !== null || format !== "pdf"}
            onClick={() => {
              if (canDownload) void downloadPdf();
              else void continueToCheckout();
            }}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {primaryPendingLabel}
              </>
            ) : canDownload ? (
              <>
                <Download className="size-4" aria-hidden />
                {primaryLabel}
              </>
            ) : (
              <>
                <span className="sm:hidden">{primaryLabelMobile}</span>
                <span className="hidden sm:inline">{primaryLabel}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
