"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Download,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAiAssistClientMessage } from "@/lib/ai/assist-client-copy";
import type { ResumeScoreOutput } from "@/lib/ai/schemas";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ResumeAiScoreVariant = "preview" | "studio" | "dashboard";

type Props = {
  projectId: string;
  variant: ResumeAiScoreVariant;
  /** Optional subtitle (e.g. most recent resume title on dashboard). */
  resumeTitle?: string;
  className?: string;
  resultMode?: "full" | "summary";
  /**
   * When provided, the result actions lead with "Download resume" (which runs
   * the caller's export/checkout flow) instead of only linking onward. Lets
   * people finish straight from the review instead of hunting for the header
   * button.
   */
  onDownload?: () => void;
  downloadPending?: boolean;
  downloadPendingText?: string;
};

type ApiOk = { ok: true; data: ResumeScoreOutput };
type ApiErr = { ok: false; error: string; code?: string };

const SECTION_LABELS: Record<string, string> = {
  summary: "Summary & profile",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  projects: "Projects",
  certifications: "Certifications",
  personal: "Contact & header",
  additional: "Additional sections",
};

function labelForSectionKey(key: string): string {
  return SECTION_LABELS[key] ?? key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreTone(score: number): string {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-rose-700";
}

function scoreRing(score: number): string {
  if (score >= 80) return "ring-emerald-500/25 bg-emerald-50/80";
  if (score >= 60) return "ring-amber-500/25 bg-amber-50/80";
  return "ring-rose-500/20 bg-rose-50/80";
}

export function ResumeAiScoreCard({
  projectId,
  variant,
  resumeTitle,
  className,
  resultMode = "full",
  onDownload,
  downloadPending = false,
  downloadPendingText,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeScoreOutput | null>(null);

  const buildHref = ROUTES.app.projectBuild(projectId);
  const previewHref = ROUTES.app.projectPreviewExport(projectId);
  const experienceHash = `${buildHref}#studio-section-experience`;

  const runScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/score-resume", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const json = (await res.json()) as ApiOk | ApiErr;
      if (!json.ok) {
        setError(formatAiAssistClientMessage(json.error, json.code));
        return;
      }
      setResult(json.data);
    } catch {
      setError(formatAiAssistClientMessage("Could not reach the review service. Try again."));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const heading = "AI Resume Review";

  const description =
    variant === "dashboard"
      ? "See strengths, gaps, and ATS-friendly formatting notes for your most recent resume."
      : variant === "preview"
        ? "Get a quick quality check before downloading. We’ll review clarity, structure, impact, and ATS-friendly formatting."
        : "Get a structured review before you export. Nothing changes until you edit your draft.";
  const topRecommendations = result
    ? [...result.priorityFixes, ...result.improvements, ...result.missingInformationWarnings].slice(0, 3)
    : [];

  const downloadAction = onDownload ? (
    <Button
      type="button"
      disabled={downloadPending}
      aria-busy={downloadPending}
      onClick={onDownload}
      className="inline-flex w-full justify-center gap-2 bg-[#2268d7] text-white hover:bg-[#1f5fca] disabled:cursor-wait disabled:opacity-75 sm:w-auto"
    >
      {downloadPending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Download className="size-4 shrink-0" aria-hidden />
      )}
      {downloadPending ? (downloadPendingText ?? "Preparing PDF...") : "Download resume"}
    </Button>
  ) : null;

  /** With a download action present, onward links step back so it reads as primary. */
  const improveVariant = onDownload ? "outline" : "default";

  return (
    <Card
      className={cn(
        "border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card shadow-soft ring-1 ring-primary/10",
        variant === "studio" && "rounded-xl border-slate-200/90 bg-white",
        variant === "dashboard" && "border-slate-200/90 bg-white",
        className,
      )}
    >
      <CardHeader className="space-y-1 pb-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">{heading}</span>
          </CardTitle>
          <CardDescription className="text-pretty text-sm">
            {description}
            {resumeTitle ? (
              <span className="mt-1 block font-medium text-foreground/80">“{resumeTitle}”</span>
            ) : null}
          </CardDescription>
        </div>
        <div className="mt-3 flex shrink-0 gap-2 sm:mt-0 sm:pl-4">
          {result && !loading ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={loading}
              onClick={() => void runScore()}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Refresh
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={loading}
            onClick={() => void runScore()}
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Reviewing…
              </>
            ) : result ? (
              "Run again"
            ) : (
              <>
                <Sparkles className="size-3.5" aria-hidden />
                Review my resume
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-0">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" aria-hidden />
            <AlertTitle>Review unavailable</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void runScore()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {loading && result ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
            Updating your review…
          </p>
        ) : null}

        {!result && !loading && !error ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {["Clarity", "Impact", "ATS-friendly format"].map((item) => (
              <div key={item} className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
                <p className="text-sm font-medium text-foreground">{item}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Quick, practical feedback before you commit to the final file.
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {loading && !result ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 py-10 text-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium text-foreground">Analyzing your resume…</p>
            <p className="max-w-md text-xs text-muted-foreground">
              This usually takes a few seconds. You can leave this page — your draft is unchanged.
            </p>
          </div>
        ) : null}

        {result && resultMode === "summary" ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div
                className={cn(
                  "flex min-w-32 flex-col items-center justify-center rounded-2xl p-5 ring-2 ring-inset",
                  scoreRing(result.score),
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Score
                </p>
                <p className={cn("text-3xl font-bold tabular-nums tracking-tight sm:text-4xl", scoreTone(result.score))}>
                  {result.score}
                </p>
                <p className="text-xs text-muted-foreground">out of 100</p>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  AI-assisted review only — not a guarantee employers or applicant tracking systems will
                  accept your resume.
                </p>
                {topRecommendations.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Top recommendations</h3>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                      {topRecommendations.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No priority recommendations returned. You can continue to export when ready.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap">
              {downloadAction}
              <Link
                href={buildHref}
                className={cn(
                  buttonVariants({ variant: improveVariant, size: "default" }),
                  "inline-flex w-full justify-center gap-2 sm:w-auto",
                )}
              >
                Improve with AI
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href="#resume-export-panel"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "default" }),
                  "inline-flex w-full justify-center gap-2 sm:w-auto",
                )}
              >
                Continue to export
              </a>
            </div>
          </>
        ) : null}

        {result && resultMode === "full" ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl p-6 ring-2 ring-inset sm:w-44 sm:shrink-0",
                  scoreRing(result.score),
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Score
                </p>
                <p className={cn("text-3xl font-bold tabular-nums tracking-tight sm:text-4xl", scoreTone(result.score))}>
                  {result.score}
                </p>
                <p className="text-xs text-muted-foreground">out of 100</p>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  AI-assisted review only — not a guarantee employers or applicant tracking systems will
                  accept your resume. Use it as a checklist before you pay to export.
                </p>
                {topRecommendations.length > 0 ? (
                  <div className="rounded-xl border border-primary/15 bg-background/80 p-4">
                    <h3 className="text-sm font-semibold text-foreground">
                      Top recommendations
                    </h3>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                      {topRecommendations.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                {result.missingInformationWarnings.length > 0 ? (
                  <Alert variant="warning">
                    <Info className="size-4" aria-hidden />
                    <AlertTitle>Missing or thin information</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                        {result.missingInformationWarnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                  Strengths
                </h3>
                {result.strengths.length ? (
                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No major strengths called out yet — keep building your draft.</p>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Target className="size-4 text-amber-600" aria-hidden />
                  Improvements
                </h3>
                {result.improvements.length ? (
                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {result.improvements.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No general improvements listed.</p>
                )}
              </div>
            </div>

            {result.priorityFixes.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-rose-200/80 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-900 dark:text-rose-100">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden />
                  Priority fixes
                </h3>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-rose-950/90 dark:text-rose-50/90">
                  {result.priorityFixes.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {Object.keys(result.sectionFeedback).length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Section feedback</h3>
                <dl className="grid gap-3 sm:grid-cols-1">
                  {Object.entries(result.sectionFeedback).map(([key, text]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-border/70 bg-muted/15 px-3 py-2.5 sm:px-4 sm:py-3"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {labelForSectionKey(key)}
                      </dt>
                      <dd className="mt-1 text-sm leading-relaxed text-foreground">{text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {result.atsFormattingNotes.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-border/70 bg-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
                  ATS-friendly formatting review
                </h3>
                <p className="text-xs text-muted-foreground">
                  Resume structure feedback — not a pass/fail or guarantee for any parser or employer.
                </p>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                  {result.atsFormattingNotes.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground/80" aria-hidden>
                        ·
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap">
              {downloadAction}
              <Link
                href={buildHref}
                className={cn(
                  buttonVariants({ variant: improveVariant, size: "default" }),
                  "inline-flex w-full justify-center gap-2 sm:w-auto",
                )}
              >
                Improve with AI
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              {variant === "preview" ? (
                <a
                  href="#resume-export-panel"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "default" }),
                    "inline-flex w-full justify-center gap-2 sm:w-auto",
                  )}
                >
                  Continue to download
                </a>
              ) : (
                <Link
                  href={previewHref}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "default" }),
                    "inline-flex w-full justify-center gap-2 sm:w-auto",
                  )}
                >
                  Continue to preview
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
              <Link
                href={experienceHash}
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" }),
                  "inline-flex w-full justify-center gap-2 sm:w-auto",
                )}
              >
                Review experience bullets
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
