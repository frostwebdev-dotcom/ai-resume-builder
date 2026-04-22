"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
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
import { AvatarUploadPanel } from "@/components/resume-preview/avatar-upload-panel";
import { IncompletePreviewNote } from "@/components/resume-preview/incomplete-preview-note";
import { PreviewViewport } from "@/components/resume-preview/preview-viewport";
import { ResumeAppearancePanel } from "@/components/resume-preview/resume-appearance-panel";
import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { TemplateThumbnail } from "@/components/resume-preview/template-thumbnail";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import type { ResumePreviewDocument } from "@/lib/resume-preview/model";
import { templateIdToSlug } from "@/lib/resume-preview/resolve-slug";
import { DEFAULT_TEMPLATE_ID, isTemplateSlug } from "@/lib/resume-preview/template-ids";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import {
  TEMPLATE_PICKER_CAPTION,
  TEMPLATE_PICKER_TITLE,
} from "@/lib/resume-preview/template-picker-copy";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { setProjectTemplateAction, updateResumeStyleAction } from "@/services/projects/actions";
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
  initialResumeStyle: ResumeStyleV1;
  /** Short-lived signed URL for an already-uploaded avatar, or null. */
  initialAvatarSignedUrl: string | null;
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
  initialResumeStyle,
  initialAvatarSignedUrl,
  checkoutNotice = null,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [checkoutBannerDismissed, setCheckoutBannerDismissed] = useState(false);
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
          <h1 className="text-balance text-display text-foreground">{projectTitle}</h1>
          <p className="text-sm text-muted-foreground">
            Pick layout and styling here; edit content in Draft. PDF export is below (one-time purchase).
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

      <IncompletePreviewNote
        hasName={document.completeness.hasName}
        filledCount={filledCount}
      />

      {/*
        Workshop layout: on xl+ the controls flow naturally in the left column
        while the preview stays pinned to the top of the viewport so users can
        always see the current design as they adjust template, appearance, and
        avatar. Below xl the stack collapses to a single column so narrow
        viewports stay readable without horizontal scrolling.
      */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(520px,min(46vw,780px))] xl:items-start">
        <div className="min-w-0 space-y-5">
          <ResumeDownloadSection
            projectId={projectId}
            canDownload={downloadAccess.canDownload}
            hasDownloadHistory={downloadAccess.hasDownloadHistory}
            checkoutEnabled={checkoutEnabled}
          />

          <section
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
                {templates.map((t) => {
                  const active = t.id === effectiveId;
                  const thumbSlug = isTemplateSlug(t.slug) ? t.slug : "athena";
                  const theme = getTemplateTheme(thumbSlug);
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
          Sticky preview aside: pinned on xl+ so it never leaves the viewport
          while the user edits. The aside itself scrolls internally when the
          resume is taller than the available viewport, so tall resumes stay
          fully reachable without losing the sticky behavior.
        */}
        <aside
          className={cn(
            "min-w-0",
            "xl:sticky xl:top-4 xl:self-start",
            "xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto xl:overscroll-contain",
            "xl:rounded-2xl xl:border xl:border-border/60 xl:bg-card/60 xl:p-3 xl:shadow-soft",
            "xl:[scrollbar-gutter:stable]",
          )}
          aria-labelledby="live-heading"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="live-heading" className="text-subhead text-foreground">
              Preview
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground ring-1 ring-border">
              Matches export
            </span>
          </div>
          <p className="mb-2 text-caption text-muted-foreground xl:hidden">
            Scroll horizontally on small screens to see the full page width, or rotate for a roomier view.
          </p>
          <PreviewViewport compactFrame>
            <ResumePreviewRenderer
              document={liveDocument}
              templateSlug={slug}
              resumeStyle={resumeStyle}
            />
          </PreviewViewport>
        </aside>
      </div>
    </div>
  );
}
