"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { WIZARD_STEPS } from "@/lib/resume-wizard/steps";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { validateStepForNavigation } from "@/lib/resume-wizard/validate-step";
import { useUnsavedWarning } from "@/hooks/use-unsaved-warning";
import { useWizardAutosave } from "@/hooks/use-wizard-autosave";
import { JobTargetPanel } from "@/components/resume-wizard/job-target-panel";
import { WizardStepForm } from "@/components/resume-wizard/wizard-step-form";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { StepIndicator } from "@/components/ui/step-indicator";
import type { JobTargetClientView } from "@/lib/job-target/client-types";
import type { TailoringCompareV1 } from "@/lib/job-target/types";
import { trackClientEvent } from "@/lib/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ResumeWizardProps = {
  projectId: string;
  projectTitle: string;
  initialState: WizardStateV1;
  initialJobTarget: JobTargetClientView | null;
};

export function ResumeWizard({
  projectId,
  projectTitle,
  initialState,
  initialJobTarget,
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-4 border-b border-border/80 pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href={ROUTES.app.project(projectId)}
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:min-h-0"
            >
              ← Back to project
            </Link>
            <Link
              href={ROUTES.app.projectPreview(projectId)}
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline sm:min-h-0"
            >
              Preview
            </Link>
          </div>
          <SaveStatusLabel status={saveStatus} onRetry={retry} />
        </div>
        <div>
          <h1 className="text-headline text-foreground">{projectTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resume builder</p>
        </div>
        <StepIndicator steps={stepItems} currentStepId={current.id} />
        <p className="text-sm text-muted-foreground">
          Step {stepIndex + 1} of {WIZARD_STEPS.length} · {current.label}
        </p>
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

      <div className="mt-6 flex-1 pb-44 md:pb-10">
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
      </div>

      {/* Sticky controls: above mobile bottom nav */}
      <div
        className={cn(
          "fixed inset-x-0 z-40 border-t border-border bg-background/95 px-4 pt-3 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md",
          "bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:bottom-0",
          "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
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
                className="min-w-[44%] flex-1 sm:min-w-[10rem] sm:flex-none"
                onClick={goNext}
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                size="touch"
                className="min-w-[44%] flex-1 sm:flex-none"
                onClick={() => void flushSave()}
              >
                Save now
              </Button>
            )}
          </div>
        </div>
      </div>
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
  if (status === "saving") {
    return <span className="text-sm text-muted-foreground">Saving…</span>;
  }
  if (status === "saved") {
    return <span className="text-sm text-success">Saved</span>;
  }
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-md px-1 text-sm font-medium text-destructive underline-offset-4 hover:underline sm:min-h-0"
      >
        Save failed — retry
      </button>
    );
  }
  return <span className="text-sm text-muted-foreground">Autosave on</span>;
}
