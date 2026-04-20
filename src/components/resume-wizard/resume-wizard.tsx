"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudAlert,
  CloudCheck,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { WIZARD_STEPS } from "@/lib/resume-wizard/steps";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { validateStepForNavigation } from "@/lib/resume-wizard/validate-step";
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

export function ResumeWizard({
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

  const { saveStatus, lastError, retry, flushSave, isDirty } = useWizardAutosave({
    projectId,
    state,
  });

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

  const stepItems = WIZARD_STEPS.map((s) => ({ id: s.id, label: s.short }));

  // Local preview is derived purely from the wizard state — no network, no
  // autosave coupling. Every keystroke flows into this document, so the
  // sticky live preview updates in lockstep with what the user is typing.
  const previewDocument = useMemo(
    () => mapWizardToPreviewDocument(state, { avatarUrl: avatarSignedUrl }),
    [state, avatarSignedUrl],
  );

  // On small screens the live preview is a toggleable drawer so the wizard
  // still gets the full width. On xl+ it's always side-by-side and sticky.
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
              Full preview &amp; export
            </Link>
          </div>
          <SaveStatusLabel status={saveStatus} onRetry={retry} />
        </div>
        <div>
          <p className="text-eyebrow">Resume builder</p>
          <h1 className="mt-2 text-headline text-foreground">{projectTitle}</h1>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-soft sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Progress
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-muted px-2.5 py-0.5 text-[0.7rem] font-semibold text-brand ring-1 ring-brand/15">
              Step{" "}
              <span className="tabular-nums">
                {stepIndex + 1}/{WIZARD_STEPS.length}
              </span>
            </span>
          </div>
          <div className="mt-3">
            <StepIndicator steps={stepItems} currentStepId={current.id} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{current.label}</p>
        </div>
      </div>

      {lastError ? (
        <div className="mt-4">
          <FeedbackBanner
            tone="error"
            title="Could not save your changes"
            description={lastError}
          />
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="mt-3 w-full sm:h-9 sm:min-h-0 sm:w-auto sm:px-3 sm:text-sm"
            onClick={retry}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {navError ? (
        <div className="mt-4">
          <FeedbackBanner tone="warning" title="Before you continue" description={navError} />
        </div>
      ) : null}

      {/*
        Workshop layout.
        - xl+: the wizard is on the left and the live preview is pinned to
          the right so users can always see how each edit lands on the page.
        - Below xl: single column. The preview is still reachable via a
          toggleable drawer so phone/tablet users don't lose it.
      */}
      <div className="mt-6 grid flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(520px,min(46vw,780px))] xl:items-start">
        <div className="flex min-w-0 flex-col pb-44 md:pb-6">
          <div key={current.id} className="animate-wizard-step space-y-6">
            <JobTargetPanel
              key={projectId}
              projectId={projectId}
              initialTitle={jobSnapshot.title}
              initialCompany={jobSnapshot.company}
              initialJobDescription={jobSnapshot.jobDescription}
              onSaved={(payload) => setJobSnapshot(payload)}
            />
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

          {/*
            Wizard action bar.
            - Mobile: fixed edge-to-edge, sitting above the bottom nav.
            - Desktop: sticky inside the wizard column so it respects the
              sidebar and the preview column, never hides the last form field,
              and stays pinned while scrolling.
          */}
          <div
            className={cn(
              "z-40 mt-6 border-t border-border/70 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
              "px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
              "fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]",
              "md:sticky md:inset-x-auto md:bottom-0 md:shadow-[0_-2px_12px_-8px_rgba(0,0,0,0.08)]",
              "md:-mx-4 md:rounded-t-xl md:px-4 lg:-mx-6 lg:px-6",
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
                    Save now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/*
          Sticky live preview aside: visible always on xl+, collapsible drawer
          below xl. The aside has its own internal scroller so tall resumes
          don't push the preview off-screen — users can always see where
          their edits land.
        */}
        <aside
          className={cn(
            "min-w-0",
            // xl+ visible, sticky, framed.
            "xl:block xl:sticky xl:top-4 xl:self-start",
            "xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto xl:overscroll-contain",
            "xl:rounded-2xl xl:border xl:border-border/60 xl:bg-card/60 xl:p-3 xl:shadow-soft",
            "xl:[scrollbar-gutter:stable]",
            // Below xl we let the user toggle visibility.
            mobilePreviewOpen ? "block" : "hidden xl:block",
          )}
          aria-labelledby="wizard-live-heading"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="wizard-live-heading" className="text-subhead text-foreground">
              Live preview
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-success ring-1 ring-success/25">
              Live
            </span>
          </div>
          <p className="mb-2 text-caption text-muted-foreground xl:hidden">
            Every change you make above appears here instantly. Your full export and template controls live on the preview page.
          </p>
          <PreviewViewport compactFrame>
            <ResumePreviewRenderer
              document={previewDocument}
              templateSlug={templateSlug}
              resumeStyle={initialResumeStyle}
            />
          </PreviewViewport>
        </aside>
      </div>

      {/* Mobile-only floating toggle: lets phone/tablet users peek at the
          live preview without leaving the wizard. On xl+ the preview is
          already visible so this button is hidden. */}
      <button
        type="button"
        onClick={() => setMobilePreviewOpen((v) => !v)}
        aria-pressed={mobilePreviewOpen}
        aria-label={mobilePreviewOpen ? "Hide live preview" : "Show live preview"}
        className={cn(
          "fixed right-4 bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] z-50",
          "inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-brand-foreground shadow-elevated ring-1 ring-brand/40",
          "transition-transform hover:-translate-y-0.5 active:translate-y-0",
          "xl:hidden",
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

function SaveStatusLabel({
  status,
  onRetry,
}: {
  status: "idle" | "saving" | "saved" | "error";
  onRetry: () => void;
}) {
  const baseChip =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";

  if (status === "saving") {
    return (
      <span
        className={cn(baseChip, "bg-muted/60 text-muted-foreground ring-border")}
      >
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className={cn(baseChip, "bg-success/12 text-success ring-success/25")}>
        <CheckCircle2 className="size-3.5" aria-hidden />
        Saved
      </span>
    );
  }
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          baseChip,
          "min-h-11 bg-destructive/12 text-destructive ring-destructive/25 transition-colors hover:bg-destructive/20 sm:min-h-0",
        )}
      >
        <CloudAlert className="size-3.5" aria-hidden />
        Save failed — retry
      </button>
    );
  }
  return (
    <span
      className={cn(baseChip, "bg-brand-muted text-brand ring-brand/15")}
    >
      <CloudCheck className="size-3.5" aria-hidden />
      Autosave on
    </span>
  );
}
