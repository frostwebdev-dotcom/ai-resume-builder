"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, ExternalLink, Loader2, Sparkles } from "lucide-react";

import { JobTargetPanel } from "@/components/resume-wizard/job-target-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { shouldOfferJobTailoringPremiumPack } from "@/lib/monetization/job-tailor-premium-ui";
import type { JobTailorReviewV1, TailoringCompareV1 } from "@/lib/job-target/types";
import { runJobTailoringPipelineAction } from "@/services/job-target/actions";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  projectPreviewHref: string;
  hasSavedJobTarget: boolean;
  jobTargetTitle: string | null;
  jobTargetCompany: string | null;
  jobTargetJobDescription: string | null;
  jobTailorReview: JobTailorReviewV1 | null;
  onJobTargetSaved?: (payload: {
    title: string | null;
    company: string | null;
    jobDescription: string;
  }) => void;
  onTailoringPipelineComplete?: (data: {
    tailoringCompare: TailoringCompareV1 | null;
    jobTailorReview: JobTailorReviewV1 | null;
    pipelineWarnings: string[];
    remainingFreeRuns: number | null;
  }) => void;
};

export function JobTailoringHub({
  projectId,
  projectPreviewHref,
  hasSavedJobTarget,
  jobTargetTitle,
  jobTargetCompany,
  jobTargetJobDescription,
  jobTailorReview,
  onJobTargetSaved,
  onTailoringPipelineComplete,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [runsHint, setRunsHint] = useState<string | null>(null);

  const runPipeline = () => {
    setError(null);
    setLimitMessage(null);
    setWarnings([]);
    setRunsHint(null);
    if (!hasSavedJobTarget) {
      setError("Save a job description first.");
      return;
    }
    start(() => {
      void (async () => {
        const res = await runJobTailoringPipelineAction({ projectId });
        if (!res.ok) {
          if (res.code === "LIMIT") {
            setLimitMessage(res.error);
          } else {
            setError(res.error);
          }
          return;
        }
        setWarnings(res.data.pipelineWarnings);
        onTailoringPipelineComplete?.(res.data);
        if (res.data.remainingFreeRuns !== null) {
          setRunsHint(`Free tailoring runs left this period: ${res.data.remainingFreeRuns}.`);
        }
        router.refresh();
      })();
    });
  };

  return (
    <section
      className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="job-tailor-hub-heading"
    >
      <div className="space-y-1">
        <h2 id="job-tailor-hub-heading" className="text-base font-semibold text-slate-900">
          Job tailoring
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {`Paste a job description and we'll suggest ways to better align your resume. Nothing changes until you accept a suggestion in each section — your original text is always preserved until then.`}
        </p>
      </div>

      <JobTargetPanel
        key={`${projectId}-${(jobTargetJobDescription ?? "").slice(0, 120)}`}
        projectId={projectId}
        initialTitle={jobTargetTitle}
        initialCompany={jobTargetCompany}
        initialJobDescription={jobTargetJobDescription}
        panelTitle="Paste the posting"
        panelLead="Save once here. We store it with this resume project only."
        saveButtonLabel="Save job target"
        onSaved={(payload) => onJobTargetSaved?.(payload)}
      />

      {limitMessage ? (
        <Alert variant="warning">
          <AlertTitle>Free limit reached</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{limitMessage}</p>
            {shouldOfferJobTailoringPremiumPack() ? (
              <Link
                href={ROUTES.pricing}
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "inline-flex w-full justify-center sm:w-auto")}
              >
                Unlock job tailoring pack
              </Link>
            ) : (
              <p className="text-sm">
                A paid tailoring pack is planned — see{" "}
                <Link href={ROUTES.pricing} className="font-medium underline underline-offset-4">
                  Pricing
                </Link>{" "}
                for what is available today, or set{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">JOB_TAILOR_UNLIMITED=1</code> in
                development.
              </p>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not tailor</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="button"
          size="touch"
          className="w-full gap-2 sm:w-auto"
          disabled={!hasSavedJobTarget || pending}
          onClick={runPipeline}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Tailoring your resume to this job…
            </>
          ) : (
            <>
              <Sparkles className="size-4" aria-hidden />
              Run AI tailoring
            </>
          )}
        </Button>
        <Link
          href={projectPreviewHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "touch" }),
            "inline-flex w-full items-center justify-center gap-2 sm:w-auto",
          )}
        >
          Preview tailored resume
          <ExternalLink className="size-4 opacity-70" aria-hidden />
        </Link>
      </div>

      {runsHint ? <p className="text-xs text-muted-foreground">{runsHint}</p> : null}

      {warnings.length > 0 ? (
        <Alert variant="info">
          <AlertTitle>Partial results</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {jobTailorReview &&
      (jobTailorReview.alignmentHighlights.length > 0 || jobTailorReview.improvementIdeas.length > 0) ? (
        <details className="group rounded-lg border border-border/80 bg-muted/15 p-3 sm:p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            <span>Resume vs. job — quick read</span>
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
            {jobTailorReview.alignmentHighlights.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Already aligned
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1.5 text-muted-foreground">
                  {jobTailorReview.alignmentHighlights.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {jobTailorReview.improvementIdeas.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Honest improvement ideas
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1.5 text-muted-foreground">
                  {jobTailorReview.improvementIdeas.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Suggestions are grounded in your saved draft and posting only — verify before you apply.
          </p>
        </details>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        After tailoring, open <span className="font-medium">Summary</span>, <span className="font-medium">Skills</span>
        , and each <span className="font-medium">Experience</span> role to compare versions and accept or keep
        yours.
      </p>
    </section>
  );
}
