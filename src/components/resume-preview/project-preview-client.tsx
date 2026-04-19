"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LayoutTemplate,
  NotebookPen,
  Sparkles,
  XCircle,
} from "lucide-react";

import { PreviewViewedTracker } from "@/components/analytics/preview-viewed-tracker";
import { IncompletePreviewNote } from "@/components/resume-preview/incomplete-preview-note";
import { PreviewViewport } from "@/components/resume-preview/preview-viewport";
import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { TemplateThumbnail } from "@/components/resume-preview/template-thumbnail";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { DEFAULT_TEMPLATE_ID, isTemplateSlug } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
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
  /** Server truth: Stripe secret configured — hide dead checkout CTAs when false. */
  checkoutEnabled: boolean;
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
  checkoutEnabled,
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

      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Link
            href={ROUTES.app.project(projectId)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to project
          </Link>
          <p className="text-eyebrow">Preview &amp; export</p>
          <h1 className="text-balance text-display text-foreground">Preview</h1>
          <p className="text-sm text-muted-foreground">{projectTitle}</p>
        </div>
        <Link
          href={ROUTES.app.projectBuild(projectId)}
          className={cn(
            buttonVariants({ variant: "outline", size: "touch" }),
            "inline-flex w-full justify-center gap-1.5 sm:w-auto",
          )}
        >
          <NotebookPen className="size-4" aria-hidden />
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
        checkoutEnabled={checkoutEnabled}
      />

      <section className="space-y-4" aria-labelledby="template-heading">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg bg-brand-muted text-brand ring-1 ring-brand/15"
            aria-hidden
          >
            <LayoutTemplate className="size-4" />
          </span>
          <h2 id="template-heading" className="text-subhead text-foreground">
            Template
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Choose a layout. Every template is single-column and ATS-linear — colors and type
            change, the parseable structure stays the same.
          </p>
          <span className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground ring-1 ring-border">
            {templates.length} designs
          </span>
        </div>
        {error ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="radiogroup"
          aria-label="Resume template"
        >
          {templates.map((t) => {
            const active = t.id === effectiveId;
            const slug = isTemplateSlug(t.slug) ? t.slug : "athena";
            const theme = getTemplateTheme(slug);
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                disabled={pending}
                onClick={() => selectTemplate(t.id)}
                aria-checked={active}
                aria-label={`${t.name} — ${theme.pickerTagline}`}
                className={cn(
                  "group/tmpl relative flex flex-col overflow-hidden rounded-xl border bg-card p-3 text-left text-sm shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
                  active
                    ? "border-brand/40 ring-2 ring-brand/25"
                    : "border-border/70 hover:border-brand/30",
                )}
              >
                {active ? (
                  <span
                    className="absolute right-2.5 top-2.5 z-10 inline-flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-soft"
                    aria-hidden
                  >
                    <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
                  </span>
                ) : null}
                <div
                  className="mb-3 overflow-hidden rounded-md ring-1 ring-border/60"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
                  }}
                >
                  <div className="p-2">
                    <TemplateThumbnail slug={t.slug} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-block size-2.5 rounded-full ring-1 ring-black/5"
                    style={{ backgroundColor: theme.accent }}
                    aria-hidden
                  />
                  <span className="font-semibold text-foreground">{t.name}</span>
                  {t.isPremium ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-warning-foreground ring-1 ring-warning/25">
                      <Sparkles className="size-3" aria-hidden />
                      Premium
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-caption leading-relaxed text-muted-foreground">
                  {theme.pickerTagline}
                </p>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground/80">
                  {theme.bestFor}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="live-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="live-heading" className="text-subhead text-foreground">
            Live preview
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground ring-1 ring-border">
            Matches export
          </span>
        </div>
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
