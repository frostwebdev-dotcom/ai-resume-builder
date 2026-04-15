"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, LayoutTemplate, XCircle, AlertCircle } from "lucide-react";

import { PreviewViewedTracker } from "@/components/analytics/preview-viewed-tracker";
import { IncompletePreviewNote } from "@/components/resume-preview/incomplete-preview-note";
import { PreviewViewport } from "@/components/resume-preview/preview-viewport";
import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { DEFAULT_TEMPLATE_ID } from "@/lib/resume-preview/template-ids";
import { setProjectTemplateAction } from "@/services/projects/actions";
import type { TemplateOption } from "@/services/templates/queries";
import type { ResumeDownloadAccess } from "@/services/downloads/queries";
import { ResumeDownloadSection } from "@/components/resume-preview/resume-download-section";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  projectId: string;
  projectTitle: string;
  document: ResumePreviewDocument;
  templates: TemplateOption[];
  selectedTemplateId: string | null;
  downloadAccess: ResumeDownloadAccess;
  /** Non-authoritative UI hint from URL; entitlement still comes from the server. */
  checkoutNotice?: "success" | "failed" | "cancelled" | null;
};

export function ProjectPreviewClient({
  projectId,
  projectTitle,
  document,
  templates,
  selectedTemplateId,
  downloadAccess,
  checkoutNotice = null,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checkoutBannerDismissed, setCheckoutBannerDismissed] = useState(false);

  const effectiveId = selectedTemplateId ?? DEFAULT_TEMPLATE_ID;
  const slug = templateIdToSlug(effectiveId);

  const selectTemplate = (templateId: string) => {
    if (templateId === effectiveId) return;
    setError(null);
    start(async () => {
      const res = await setProjectTemplateAction({ projectId, templateId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const filledCount = document.completeness.filledSections.length;

  const dismissCheckoutBanner = () => {
    setCheckoutBannerDismissed(true);
    router.replace(ROUTES.app.projectPreview(projectId));
  };

  const showCheckoutBanner = Boolean(checkoutNotice) && !checkoutBannerDismissed;

  return (
    <div className="space-y-8">
      <PreviewViewedTracker projectId={projectId} />
      {showCheckoutBanner && checkoutNotice === "success" ? (
        <Alert variant="success">
          <CheckCircle2 aria-hidden />
          <AlertTitle>Back from checkout</AlertTitle>
          <AlertDescription>
            If your PDF unlock is still loading, wait a few seconds—the server confirms payment in the
            background. This message is informational only.
          </AlertDescription>
          <div className="mt-2 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={dismissCheckoutBanner}>
              Dismiss
            </Button>
          </div>
        </Alert>
      ) : null}
      {showCheckoutBanner && checkoutNotice === "failed" ? (
        <Alert variant="destructive">
          <XCircle aria-hidden />
          <AlertTitle>Payment did not complete</AlertTitle>
          <AlertDescription>
            You can try unlocking again when you are ready. Entitlement is only granted after a confirmed
            payment.
          </AlertDescription>
          <div className="mt-2 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={dismissCheckoutBanner}>
              Dismiss
            </Button>
          </div>
        </Alert>
      ) : null}
      {showCheckoutBanner && checkoutNotice === "cancelled" ? (
        <Alert variant="warning">
          <AlertCircle aria-hidden />
          <AlertTitle>Checkout cancelled</AlertTitle>
          <AlertDescription>No charge was made. You can continue previewing and pay when you are ready.</AlertDescription>
          <div className="mt-2 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={dismissCheckoutBanner}>
              Dismiss
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4 border-b border-border/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Link
            href={ROUTES.app.project(projectId)}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Back to project
          </Link>
          <h1 className="text-balance text-display text-foreground">Preview</h1>
          <p className="text-sm text-muted-foreground">{projectTitle}</p>
        </div>
        <Link
          href={ROUTES.app.projectBuild(projectId)}
          className={cn(
            buttonVariants({ variant: "outline", size: "touch" }),
            "inline-flex w-full justify-center sm:w-auto",
          )}
        >
          Edit in builder
        </Link>
      </div>

      <IncompletePreviewNote
        hasName={document.completeness.hasName}
        filledCount={filledCount}
      />

      <ResumeDownloadSection
        projectId={projectId}
        canDownload={downloadAccess.canDownload}
        hasDownloadHistory={downloadAccess.hasDownloadHistory}
      />

      <section className="space-y-3" aria-labelledby="template-heading">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="size-5 text-muted-foreground" aria-hidden />
          <h2 id="template-heading" className="text-subhead text-foreground">
            Template
          </h2>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Choose a layout. Previews use the same structure we intend for PDF export — simple columns, clear headings, no graphics that confuse ATS tools.
        </p>
        {error ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          {templates.map((t) => {
            const active = t.id === effectiveId;
            return (
              <button
                key={t.id}
                type="button"
                disabled={pending}
                onClick={() => selectTemplate(t.id)}
                className={cn(
                  "rounded-xl border bg-card p-4 text-left text-sm shadow-sm ring-1 transition-colors",
                  active
                    ? "border-primary ring-2 ring-primary/25"
                    : "border-border/80 ring-foreground/5 hover:border-border hover:bg-muted/30",
                )}
              >
                <span className="font-semibold text-foreground">{t.name}</span>
                {t.isPremium ? (
                  <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-caption text-primary">
                    Premium
                  </span>
                ) : null}
                {t.description ? (
                  <p className="mt-2 text-caption leading-relaxed text-muted-foreground">
                    {t.description}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="live-heading">
        <h2 id="live-heading" className="text-subhead text-foreground">
          Live preview
        </h2>
        <p className="text-caption text-muted-foreground sm:hidden">
          Scroll horizontally on small screens to see the full page width, or rotate for a roomier view.
        </p>
        <PreviewViewport compactFrame>
          <ResumePreviewRenderer document={document} templateSlug={slug} />
        </PreviewViewport>
      </section>
    </div>
  );
}
