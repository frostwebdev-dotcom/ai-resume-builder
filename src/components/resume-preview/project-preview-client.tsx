"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Download,
  Eye,
  LayoutTemplate,
  NotebookPen,
  Sparkles,
  XCircle,
} from "lucide-react";

import { PreviewViewedTracker } from "@/components/analytics/preview-viewed-tracker";
import { AvatarUploadPanel } from "@/components/resume-preview/avatar-upload-panel";
import { ResumeAiScoreCard } from "@/components/resume-preview/resume-ai-score-card";
import { IncompletePreviewNote } from "@/components/resume-preview/incomplete-preview-note";
import { PreviewViewport } from "@/components/resume-preview/preview-viewport";
import { ResumeAppearancePanel } from "@/components/resume-preview/resume-appearance-panel";
import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import {
  DEFAULT_TEMPLATE_ID,
  DEFAULT_TEMPLATE_SLUG,
  isTemplateSlug,
  type TemplateSlug,
} from "@/lib/resume-preview/template-ids";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import {
  TEMPLATE_PICKER_CAPTION,
  TEMPLATE_PICKER_TITLE,
} from "@/lib/resume-preview/template-picker-copy";
import { setProjectTemplateAction, updateResumeStyleAction } from "@/services/projects/actions";
import type { TemplateOption } from "@/services/templates/queries";
import type { ResumeDownloadAccess } from "@/services/downloads/queries";
import { ResumeDownloadSection } from "@/components/resume-preview/resume-download-section";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type PreviewZoom = "fit" | "75" | "100";

type Props = {
  projectId: string;
  projectTitle: string;
  document: ResumePreviewDocument;
  templates: TemplateOption[];
  selectedTemplateId: string | null;
  downloadAccess: ResumeDownloadAccess;
  /** Server truth: Stripe secret configured — hide dead checkout CTAs when false. */
  checkoutEnabled: boolean;
  /** Admin/dev users can see payment setup guidance; production users get support copy. */
  showPaymentSetupDetails: boolean;
  initialResumeStyle: ResumeStyleV1;
  /** Short-lived signed URL for an already-uploaded avatar, or null. */
  initialAvatarSignedUrl: string | null;
  /** Non-authoritative UI hint from URL; entitlement still comes from the server. */
  checkoutNotice?: "success" | "failed" | "cancelled" | "pending" | null;
};

export function ProjectPreviewClient({
  projectId,
  projectTitle,
  document,
  templates,
  selectedTemplateId,
  downloadAccess,
  checkoutEnabled,
  showPaymentSetupDetails,
  initialResumeStyle,
  initialAvatarSignedUrl,
  checkoutNotice = null,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checkoutBannerDismissed, setCheckoutBannerDismissed] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<PreviewZoom>("fit");
  const [resumeStyle, setResumeStyle] = useState<ResumeStyleV1>(initialResumeStyle);
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(
    initialAvatarSignedUrl,
  );
  const styleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveId = selectedTemplateId ?? DEFAULT_TEMPLATE_ID;
  const slug = templateIdToSlug(effectiveId);

  // Merge the latest avatar URL into the preview document so the live preview
  // reflects uploads immediately without waiting for a router.refresh().
  const liveDocument: ResumePreviewDocument =
    document.identity.avatarUrl === avatarSignedUrl
      ? document
      : {
          ...document,
          identity: { ...document.identity, avatarUrl: avatarSignedUrl },
        };

  const handleResumeStyleChange = (next: ResumeStyleV1) => {
    setResumeStyle(next);
    if (styleSaveTimer.current) clearTimeout(styleSaveTimer.current);
    styleSaveTimer.current = setTimeout(() => {
      void updateResumeStyleAction({ projectId, resumeStyle: next });
    }, 500);
  };

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
  const displayTitle = projectTitle.trim() || "Resume Preview";
  const orderedTemplates = orderTemplatesForPicker(templates);

  const dismissCheckoutBanner = () => {
    setCheckoutBannerDismissed(true);
    router.replace(ROUTES.app.projectPreview(projectId));
  };

  const showCheckoutBanner = Boolean(checkoutNotice) && !checkoutBannerDismissed;

  return (
    <div className="min-w-0 space-y-8 pb-app-nav-and-actions-md md:pb-0">
      <PreviewViewedTracker projectId={projectId} />
      {showCheckoutBanner && checkoutNotice === "success" && downloadAccess.canDownload ? (
        <Alert variant="success">
          <CheckCircle2 aria-hidden />
          <AlertTitle>Payment confirmed</AlertTitle>
          <AlertDescription>
            Your PDF export is unlocked below. This reflects server-verified payment status—not the URL
            alone.
          </AlertDescription>
          <div className="mt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="default"
              className="min-h-11 touch-manipulation sm:min-h-9"
              onClick={dismissCheckoutBanner}
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      ) : null}
      {showCheckoutBanner && checkoutNotice === "success" && !downloadAccess.canDownload ? (
        <Alert variant="info">
          <AlertCircle aria-hidden />
          <AlertTitle>Confirming your payment</AlertTitle>
          <AlertDescription>
            Stripe redirected you back, but the unlock appears only after our server processes a
            verified webhook. Wait a few seconds and refresh, or use{" "}
            <strong className="font-medium text-foreground">Try payment again</strong> below if this
            persists.
          </AlertDescription>
          <div className="mt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="default"
              className="min-h-11 touch-manipulation sm:min-h-9"
              onClick={dismissCheckoutBanner}
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      ) : null}
      {showCheckoutBanner && checkoutNotice === "pending" ? (
        <Alert variant="warning">
          <AlertCircle aria-hidden />
          <AlertTitle>Still confirming</AlertTitle>
          <AlertDescription>
            We could not confirm unlock from the return page in time. If you were charged, refresh this
            page in a minute—the download unlocks from our database, not from a query parameter.
          </AlertDescription>
          <div className="mt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="default"
              className="min-h-11 touch-manipulation sm:min-h-9"
              onClick={dismissCheckoutBanner}
            >
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
            <Button
              type="button"
              variant="outline"
              size="default"
              className="min-h-11 touch-manipulation sm:min-h-9"
              onClick={dismissCheckoutBanner}
            >
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
            <Button
              type="button"
              variant="outline"
              size="default"
              className="min-h-11 touch-manipulation sm:min-h-9"
              onClick={dismissCheckoutBanner}
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Link
            href={ROUTES.app.project(projectId)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to project
          </Link>
          <p className="text-eyebrow">Advanced preview settings</p>
          <h1 className="line-clamp-3 text-balance break-words text-display text-foreground">{displayTitle}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Advanced template, appearance, avatar, and preview controls. Use the focused export flow for final checkout and download.
          </p>
        </div>
        <Link
          href={ROUTES.app.projectBuild(projectId)}
          className={cn(
            buttonVariants({ variant: "outline", size: "touch" }),
            "inline-flex w-full justify-center gap-1.5 sm:w-auto",
          )}
        >
          <NotebookPen className="size-4" aria-hidden />
          Back to draft
        </Link>
      </div>

      <nav
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:hidden"
        aria-label="Preview page sections"
      >
        {mobileSectionLinks.map(({ href, label, Icon }) => (
          <a
            key={href}
            href={href}
            className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border border-border/70 bg-card px-2 py-2 text-center text-[0.68rem] font-medium text-muted-foreground shadow-soft"
          >
            <Icon className="size-4 text-brand" aria-hidden />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <IncompletePreviewNote
        hasName={document.completeness.hasName}
        filledCount={filledCount}
      />

      {/*
        Workshop layout: on md+ the controls flow naturally in the left column
        while the preview stays pinned to the top of the viewport so users can
        always see the current design as they adjust template, appearance, and
        avatar. Below xl the stack collapses to a single column so narrow
        viewports stay readable without horizontal scrolling.
        Second column uses % of the grid (not vw) so it stays within the main
        shell beside the sidebar; minmax(0,…) lets the preview column shrink and
        rely on the inner horizontal scroller on the paper canvas.
      */}
      <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,min(780px,50%))] md:items-start">
        <div className="order-2 min-w-0 space-y-5 md:order-1">
          <div id="export-section" className="scroll-mt-20">
          <ResumeDownloadSection
            projectId={projectId}
            canDownload={downloadAccess.canDownload}
            hasDownloadHistory={downloadAccess.hasDownloadHistory}
            checkoutEnabled={checkoutEnabled}
            showPaymentSetupDetails={showPaymentSetupDetails}
            checkoutNotice={checkoutNotice}
          />
          </div>

          <section id="ai-review-section" className="scroll-mt-20" aria-label="AI Resume Review">
            <ResumeAiScoreCard projectId={projectId} variant="preview" />
          </section>

          <section
            id="template-section"
            className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-5"
            aria-labelledby="template-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center rounded-lg bg-brand-muted text-brand ring-1 ring-brand/15"
                  aria-hidden
                >
                  <LayoutTemplate className="size-4" />
                </span>
                <div className="min-w-0 space-y-1">
                  <h2 id="template-heading" className="text-subhead text-foreground">
                    {TEMPLATE_PICKER_TITLE}
                  </h2>
                  <p className="text-caption text-muted-foreground">{TEMPLATE_PICKER_CAPTION}</p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground ring-1 ring-border">
                {templates.length} templates
              </span>
            </div>
            {error ? (
              <p className="text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <div
              className="max-h-[min(420px,52vh)] overflow-y-auto overscroll-contain rounded-xl border border-border/60 bg-muted/20 p-2 pr-1"
              tabIndex={0}
              aria-label={`${TEMPLATE_PICKER_TITLE} — choose a layout`}
            >
              <div
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3"
                role="radiogroup"
                aria-label={TEMPLATE_PICKER_TITLE}
              >
                {orderedTemplates.map((t) => {
                  const active = t.id === effectiveId;
                  const thumbSlug = isTemplateSlug(t.slug) ? t.slug : DEFAULT_TEMPLATE_SLUG;
                  const meta = templateCardMeta(thumbSlug, t);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      disabled={pending}
                      onClick={() => selectTemplate(t.id)}
                      aria-checked={active}
                      aria-label={`Use template: ${meta.name}${t.isPremium ? " (premium)" : ""}`}
                      className={cn(
                        "group/tmpl relative flex flex-col overflow-hidden rounded-xl border bg-card p-2 text-left text-sm shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
                        active
                          ? "border-brand/60 ring-2 ring-brand/25"
                          : "border-border/70 hover:border-brand/30",
                      )}
                    >
                      {active ? (
                        <span
                          className="absolute right-2 top-2 z-20 inline-flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-soft"
                          aria-hidden
                        >
                          <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
                        </span>
                      ) : null}
                      {t.isPremium ? (
                        <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-warning/90 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-warning-foreground shadow-sm ring-1 ring-warning/30">
                          <Sparkles className="size-2.5" aria-hidden />
                          Premium
                        </span>
                      ) : null}
                      <div
                        className="overflow-hidden rounded-md ring-1 ring-border/60"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
                        }}
                      >
                        <div className="p-1.5">
                          <TemplateCatalogLivePreview
                            slug={thumbSlug}
                            className="shadow-none ring-0"
                          />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-2">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold leading-snug text-foreground">
                              {meta.name}
                            </h3>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-emerald-700 ring-1 ring-emerald-600/15">
                              <BadgeCheck className="size-3" aria-hidden />
                              ATS-friendly
                            </span>
                          </div>
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {meta.description}
                          </p>
                        </div>
                        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground">Best for:</span>{" "}
                          {meta.bestFor}
                        </p>
                        <span
                          className={cn(
                            "mt-auto inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors",
                            active
                              ? "bg-brand text-brand-foreground"
                              : "border border-border/70 bg-background text-foreground group-hover/tmpl:border-brand/30",
                          )}
                        >
                          {active ? "Selected" : "Use template"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <ResumeAppearancePanel
            templateSlug={slug}
            resumeStyle={resumeStyle}
            onResumeStyleChange={handleResumeStyleChange}
          />

          <AvatarUploadPanel
            projectId={projectId}
            templateSlug={slug}
            avatarSignedUrl={avatarSignedUrl}
            resumeStyle={resumeStyle}
            onResumeStyleChange={handleResumeStyleChange}
            onAvatarChange={(next) => setAvatarSignedUrl(next.signedUrl)}
          />
        </div>

        {/*
          Sticky preview aside: pinned on md+ so it never leaves the viewport
          while the user edits. The aside itself scrolls internally when the
          resume is taller than the available viewport, so tall resumes stay
          fully reachable without losing the sticky behavior.
        */}
        <aside
          id="preview-section"
          className={cn(
            "order-1 min-w-0 w-full max-w-full scroll-mt-20 md:order-2",
            "md:sticky md:top-4 md:self-start",
            "md:max-h-[calc(100dvh-2rem)] md:overflow-y-auto md:overscroll-contain",
            "md:rounded-2xl md:border md:border-border/60 md:bg-card/60 md:p-3 md:shadow-soft",
            "md:[scrollbar-gutter:stable]",
          )}
          aria-labelledby="live-heading"
        >
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 id="live-heading" className="text-subhead text-foreground">
                Preview
              </h2>
              <p className="text-caption text-muted-foreground">
                Focused view of the same layout used for export.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground ring-1 ring-border">
                Matches export
              </span>
              <div className="inline-flex rounded-xl border border-border/70 bg-background p-1" aria-label="Preview zoom">
                {previewZoomOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={previewZoom === option.value}
                    onClick={() => setPreviewZoom(option.value)}
                    className={cn(
                      "min-h-9 rounded-lg px-2.5 text-xs font-medium transition-colors",
                      previewZoom === option.value
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mb-2 text-caption text-muted-foreground md:hidden">
            Scroll horizontally on small screens to see the full page width, or rotate for a roomier view.
          </p>
          <PreviewViewport compactFrame className="bg-gradient-to-b from-slate-100 to-slate-50 shadow-inner ring-1 ring-slate-200/80">
            <div
              className="mx-auto flex justify-center"
              style={
                previewZoom === "fit"
                  ? undefined
                  : ({ zoom: previewZoom === "75" ? 0.75 : 1 } as CSSProperties)
              }
            >
              <ResumePreviewRenderer
                document={liveDocument}
                templateSlug={slug}
                resumeStyle={resumeStyle}
              />
            </div>
          </PreviewViewport>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] z-30 px-3 md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-background/95 p-2 shadow-elevated backdrop-blur">
          <Link
            href={ROUTES.app.projectBuild(projectId)}
            className={cn(buttonVariants({ variant: "outline", size: "touch" }), "min-h-12 px-3 text-sm")}
          >
            <NotebookPen className="size-4" aria-hidden />
            Edit
          </Link>
          <a
            href="#ai-review-section"
            className={cn(buttonVariants({ variant: "secondary", size: "touch" }), "min-h-12 px-3 text-sm")}
          >
            <Sparkles className="size-4" aria-hidden />
            AI Review
          </a>
          <a
            href="#resume-export-panel"
            className={cn(buttonVariants({ variant: "default", size: "touch" }), "min-h-12 px-3 text-sm")}
          >
            <Download className="size-4" aria-hidden />
            PDF
          </a>
        </div>
      </div>
    </div>
  );
}

const mobileSectionLinks = [
  { href: "#preview-section", label: "Preview", Icon: Eye },
  { href: "#template-section", label: "Template", Icon: LayoutTemplate },
  { href: "#export-section", label: "Export", Icon: Download },
  { href: "#ai-review-section", label: "AI Review", Icon: Sparkles },
] as const;

const previewZoomOptions: Array<{ value: PreviewZoom; label: string }> = [
  { value: "fit", label: "Fit width" },
  { value: "75", label: "75%" },
  { value: "100", label: "100%" },
];

const recommendedTemplateMeta = {
  "professional-ats": {
    name: "Professional ATS",
    description: "A conservative, recruiter-friendly layout with clean section flow.",
    bestFor: "most roles",
    order: 0,
  },
  "modern-professional": {
    name: "Modern Professional",
    description: "A polished single-column design with subtle visual structure.",
    bestFor: "polished general use",
    order: 1,
  },
  "technical-clean": {
    name: "Technical Clean",
    description: "A dense, readable format for skills, projects, and impact bullets.",
    bestFor: "developers and engineers",
    order: 2,
  },
  clio: {
    name: "Executive Classic",
    description: "A timeless, senior-friendly layout with calm typography and clear hierarchy.",
    bestFor: "senior professionals",
    order: 3,
  },
} as const;

function orderTemplatesForPicker(templates: TemplateOption[]): TemplateOption[] {
  return [...templates].sort((a, b) => {
    const aSlug = isTemplateSlug(a.slug) ? a.slug : DEFAULT_TEMPLATE_SLUG;
    const bSlug = isTemplateSlug(b.slug) ? b.slug : DEFAULT_TEMPLATE_SLUG;
    const aOrder = recommendedTemplateMeta[aSlug as keyof typeof recommendedTemplateMeta]?.order ?? 99;
    const bOrder = recommendedTemplateMeta[bSlug as keyof typeof recommendedTemplateMeta]?.order ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });
}

function templateCardMeta(slug: keyof typeof recommendedTemplateMeta | TemplateSlug, t: TemplateOption) {
  const recommended = recommendedTemplateMeta[slug as keyof typeof recommendedTemplateMeta];
  if (recommended) return recommended;
  return {
    name: t.name,
    description: t.description ?? "Professional PDF-ready resume layout.",
    bestFor: "clear, professional presentation",
  };
}
