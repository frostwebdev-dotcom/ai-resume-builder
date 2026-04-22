"use client";

import Link from "next/link";
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, EyeOff, FileUp } from "lucide-react";

import { AutosaveStatusChip } from "@/components/resume-wizard/autosave-status-chip";
import { WIZARD_STEPS } from "@/lib/resume-wizard/steps";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { validateStepForNavigation } from "@/lib/resume-wizard/validate-step";
import { useGuestWizardAutosave } from "@/hooks/use-guest-wizard-autosave";
import { useUnsavedWarning } from "@/hooks/use-unsaved-warning";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { JobTargetPanel } from "@/components/resume-wizard/job-target-panel";
import { WizardStepForm } from "@/components/resume-wizard/wizard-step-form";
import { PreviewViewport } from "@/components/resume-preview/preview-viewport";
import { ResumePreviewRenderer } from "@/components/resume-preview/resume-preview-renderer";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { StepIndicator } from "@/components/ui/step-indicator";
import type { JobTargetClientView } from "@/lib/job-target/client-types";
import type { TailoringCompareV1 } from "@/lib/job-target/types";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/constants";
import { mapWizardToPreviewDocument } from "@/lib/resume-preview/map-wizard-to-preview";
import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { cn } from "@/lib/utils";

type ResumeWizardProps = {
  /**
   * Browser-only draft on `/create` — no Supabase project until the user signs in
   * and creates a saved resume from the dashboard.
   */
  guestMode?: boolean;
  projectId: string;
  projectTitle: string;
  initialState: WizardStateV1;
  initialJobTarget: JobTargetClientView | null;
  /** Template selected on the project — drives the live preview layout. */
  templateSlug: TemplateSlug;
  /** Persisted style overrides (colors, type, spacing). */
  initialResumeStyle: ResumeStyleV1;
  /** Signed URL for the project avatar, or null if none uploaded. */
  avatarSignedUrl: string | null;
};

/**
 * @deprecated Legacy step-by-step draft UI. Product `/build` uses `ProjectStudioShell` (studio).
 * Still here for reuse or tests—delete only after confirming no imports.
 */
export function ResumeWizard({
  guestMode = false,
  projectId,
  projectTitle,
  initialState,
  initialJobTarget,
  templateSlug,
  initialResumeStyle,
  avatarSignedUrl,
}: ResumeWizardProps) {
  const [state, setState] = useState<WizardStateV1>(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [navError, setNavError] = useState<string | null>(null);
  const [jobSnapshot, setJobSnapshot] = useState({
    title: initialJobTarget?.title ?? null,
    company: initialJobTarget?.company ?? null,
    jobDescription: initialJobTarget?.jobDescription ?? null,
  });
  const [tailoringCompare, setTailoringCompare] = useState<TailoringCompareV1 | null>(
    initialJobTarget?.tailoringCompare ?? null,
  );

  useEffect(() => {
    setJobSnapshot({
      title: initialJobTarget?.title ?? null,
      company: initialJobTarget?.company ?? null,
      jobDescription: initialJobTarget?.jobDescription ?? null,
    });
    setTailoringCompare(initialJobTarget?.tailoringCompare ?? null);
    // Intentionally only when switching projects — avoids clobbering local job snapshot after save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const hasSavedJobTarget = (jobSnapshot.jobDescription?.trim().length ?? 0) > 0;

  const serverAutosave = useWizardAutosave({
    projectId,
    state,
    enabled: !guestMode,
  });
  const guestAutosave = useGuestWizardAutosave({
    state,
    enabled: guestMode,
  });
  const { saveStatus, lastError, retry, flushSave, isDirty } = guestMode
    ? guestAutosave
    : serverAutosave;

  useUnsavedWarning(isDirty);

  const current = WIZARD_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === WIZARD_STEPS.length - 1;

  const goNext = useCallback(() => {
    setNavError(null);
    const result = validateStepForNavigation(current.id, state);
    if (!result.ok) {
      setNavError(result.message);
      return;
    }
    trackClientEvent(ANALYTICS_EVENTS.WIZARD_STEP_COMPLETED, {
      step_id: current.id,
      step_index: stepIndex,
    });
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  }, [current.id, state, stepIndex]);

  const goBack = useCallback(() => {
    setNavError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const stepItems = useMemo(
    () => WIZARD_STEPS.map((s) => ({ id: s.id, label: s.short })),
    [],
  );

  // Defer mapping the full preview document so rapid typing keeps the wizard
  // thread responsive; the preview catches up on the next paint (React 18+).
  const deferredState = useDeferredValue(state);
  const previewDocument = useMemo(
    () => mapWizardToPreviewDocument(deferredState, { avatarUrl: avatarSignedUrl }),
    [deferredState, avatarSignedUrl],
  );

  // On small screens the live preview is a toggleable drawer so the wizard
  // still gets the full width. On xl+ it's always side-by-side and sticky.
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {guestMode ? null : (
        <div className="space-y-5 border-b border-border/70 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link
                href={ROUTES.app.project(projectId)}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline sm:min-h-0"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back to project
              </Link>
              <Link
                href={ROUTES.app.projectPreview(projectId)}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 transition-colors hover:underline sm:min-h-0"
              >
                <Eye className="size-4" aria-hidden />
                Preview &amp; export
              </Link>
            </div>
            <AutosaveStatusChip
              context="project"
              status={saveStatus}
              lastError={lastError}
              onRetry={retry}
            />
          </div>
          <div>
            <p className="text-eyebrow">Draft</p>
            <h1 className="mt-2 text-headline text-foreground">{projectTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              When your content is ready, open Preview &amp; export to choose a template and export a PDF.
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Sections
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-muted px-2.5 py-0.5 text-[0.7rem] font-semibold text-brand ring-1 ring-brand/15">
                Section{" "}
                <span className="tabular-nums">
                  {stepIndex + 1} of {WIZARD_STEPS.length}
                </span>
              </span>
            </div>
            <div className="mt-3">
              <StepIndicator steps={stepItems} currentStepId={current.id} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{current.label}</p>
          </div>
        </div>
      )}

      {guestMode ? (
        <div className="mb-3 flex items-center justify-between gap-3 px-4 py-3 text-xs sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-background px-2.5 py-1 font-semibold text-muted-foreground ring-1 ring-border">
            Section
            <span className="tabular-nums text-foreground">
              {stepIndex + 1} of {WIZARD_STEPS.length}
            </span>
          </div>
          <AutosaveStatusChip
            context="guestDevice"
            status={saveStatus}
            lastError={lastError}
            onRetry={retry}
          />
        </div>
      ) : null}

      {navError ? (
        <div className="mt-4">
          <FeedbackBanner tone="warning" title="Before you continue" description={navError} />
        </div>
      ) : null}

      {/*
        Workshop layout.
        - xl+: draft column on the left, preview pinned on the right.
        - Below xl: single column; preview via toggleable drawer on small screens.
      */}
      <div
        className={cn(
          guestMode
            ? "grid min-h-0 flex-1 gap-0 border-y border-border/70 bg-muted/30 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
            : "mt-6 grid flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(520px,min(46vw,780px))] xl:items-start",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col",
            guestMode
              ? "min-h-0 border-r border-border/60 bg-muted/20 px-4 pb-32 pt-4 sm:px-6"
              : "pb-44 md:pb-6",
          )}
        >
          <div key={current.id} className="animate-draft-step space-y-6">
            {guestMode ? <GuestIntakeShortcuts /> : null}
            {!guestMode ? (
              <JobTargetPanel
                key={projectId}
                projectId={projectId}
                guestMode={guestMode}
                initialTitle={jobSnapshot.title}
                initialCompany={jobSnapshot.company}
                initialJobDescription={jobSnapshot.jobDescription}
                onSaved={(payload) => setJobSnapshot(payload)}
              />
            ) : null}
            <div className={cn(guestMode ? "rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5" : "")}>
              <WizardStepForm
                projectId={projectId}
                stepId={current.id}
                state={state}
                setState={setState}
                hasSavedJobTarget={hasSavedJobTarget}
                tailoringCompare={tailoringCompare}
                setTailoringCompare={setTailoringCompare}
              />
            </div>
          </div>

          {/*
            Draft navigation bar.
            - Mobile: fixed above bottom nav.
            - Desktop: sticky in the draft column while scrolling.
          */}
          <div
            className={cn(
              "z-40 mt-6 border-t border-border/70 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
              guestMode
                ? "sticky bottom-0 -mx-4 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-2px_12px_-8px_rgba(0,0,0,0.12)] sm:-mx-6 sm:px-6"
                : "px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
              guestMode
                ? ""
                : "fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]",
              guestMode
                ? ""
                : "md:sticky md:inset-x-auto md:bottom-0 md:shadow-[0_-2px_12px_-8px_rgba(0,0,0,0.08)]",
              guestMode ? "" : "md:-mx-4 md:rounded-t-xl md:px-4 lg:-mx-6 lg:px-6",
            )}
          >
            <div className="mx-auto flex max-w-3xl items-stretch justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="min-w-[44%] sm:min-w-[8rem]"
                disabled={isFirst}
                onClick={goBack}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Back
              </Button>
              <div className="flex flex-1 justify-end gap-2">
                {!isLast ? (
                  <Button
                    type="button"
                    size="touch"
                    className="min-w-[44%] flex-1 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90 sm:min-w-[10rem] sm:flex-none"
                    onClick={goNext}
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="touch"
                    className="min-w-[44%] flex-1 bg-brand text-brand-foreground shadow-soft hover:bg-brand/90 sm:flex-none"
                    onClick={() => void flushSave()}
                  >
                    Save to project
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/*
          Sticky preview aside (xl+); drawer below xl. Internal scroll for tall resumes.
        */}
        <aside
          className={cn(
            "min-w-0",
            // xl+ visible, sticky, framed.
            guestMode
              ? "lg:block lg:min-h-0 lg:overflow-y-auto lg:bg-slate-100/70 lg:p-5"
              : "xl:block xl:sticky xl:top-4 xl:self-start",
            guestMode
              ? ""
              : "xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto xl:overscroll-contain",
            guestMode
              ? ""
              : "xl:rounded-2xl xl:border xl:border-border/60 xl:bg-card/60 xl:p-3 xl:shadow-soft",
            guestMode ? "" : "xl:[scrollbar-gutter:stable]",
            // Below xl we let the user toggle visibility.
            mobilePreviewOpen ? "block" : guestMode ? "hidden lg:block" : "hidden xl:block",
          )}
          aria-labelledby="draft-preview-heading"
        >
          {guestMode ? (
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="draft-preview-heading" className="text-sm font-semibold text-foreground">
                Preview
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand ring-1 ring-brand/20">
                Live
              </span>
            </div>
          ) : (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="draft-preview-heading" className="text-subhead text-foreground">
                Preview
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-success ring-1 ring-success/25">
                Live
              </span>
            </div>
          )}
          <p className={cn("mb-2 text-caption text-muted-foreground", guestMode ? "lg:hidden" : "xl:hidden")}>
            Updates as you type. Template, appearance, and PDF export are on Preview &amp; export.
          </p>
          <PreviewViewport compactFrame={!guestMode}>
            <ResumePreviewRenderer
              document={previewDocument}
              templateSlug={templateSlug}
              resumeStyle={initialResumeStyle}
            />
          </PreviewViewport>
        </aside>
      </div>

      {/* Mobile-only: show/hide preview panel; hidden on xl+ where preview is always visible. */}
      <button
        type="button"
        onClick={() => setMobilePreviewOpen((v) => !v)}
        aria-pressed={mobilePreviewOpen}
        aria-label={mobilePreviewOpen ? "Hide preview panel" : "Show preview panel"}
        className={cn(
          "fixed right-4 bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] z-50",
          "inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-brand-foreground shadow-elevated ring-1 ring-brand/40",
          "transition-transform hover:-translate-y-0.5 active:translate-y-0",
          guestMode ? "lg:hidden" : "xl:hidden",
        )}
      >
        {mobilePreviewOpen ? (
          <>
            <EyeOff className="size-4" aria-hidden />
            Hide preview
          </>
        ) : (
          <>
            <Eye className="size-4" aria-hidden />
            Show preview
          </>
        )}
      </button>
    </div>
  );
}

const GuestIntakeShortcuts = memo(function GuestIntakeShortcuts() {
  return (
    <section className="rounded-xl border border-border/70 bg-card p-2 shadow-sm sm:p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="inline-flex min-h-16 items-center justify-center gap-2 rounded-lg border border-border/70 bg-muted/35 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/55"
        >
          <FileUp className="size-4" aria-hidden />
          Upload existing resume
        </button>
        <button
          type="button"
          className="inline-flex min-h-16 items-center justify-center gap-2 rounded-lg border border-border/70 bg-muted/35 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/55"
        >
          <span className="inline-flex size-4 items-center justify-center rounded-full border border-current text-[0.6rem] font-bold uppercase">
            in
          </span>
          Import LinkedIn profile
        </button>
      </div>
    </section>
  );
});
