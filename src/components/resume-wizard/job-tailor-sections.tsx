"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { TailoringCompareV1 } from "@/lib/job-target/types";
import type { WorkExperienceEntry, WizardStateV1 } from "@/lib/resume-wizard/types";
import {
  acceptTailoredExperienceAction,
  acceptTailoredSkillsAction,
  acceptTailoredSummaryAction,
  rejectTailoredExperienceAction,
  rejectTailoredSkillsAction,
  rejectTailoredSummaryAction,
  tailorExperienceToJobAction,
  tailorSkillsToJobAction,
  tailorSummaryToJobAction,
} from "@/services/job-target/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AI_JOB_POSTING_TAILOR_DISCLAIMER,
  AI_MATCH_SAVED_POSTING_LINE,
  formatAiAssistClientMessage,
} from "@/lib/ai/assist-client-copy";
import { cn } from "@/lib/utils";

function tailorFailureMessage(res: { ok: false; error: string; code?: string }): string {
  return formatAiAssistClientMessage(res.error, res.code);
}

export function JobTailorDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-[0.7rem] leading-snug text-muted-foreground",
        className,
      )}
    >
      {AI_JOB_POSTING_TAILOR_DISCLAIMER}
    </p>
  );
}

function TailorButton({
  children,
  pending,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  pending?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="min-h-10 w-full justify-center gap-1.5 sm:min-h-9 sm:w-auto"
      disabled={disabled || pending}
      onClick={onClick}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Sparkles className="size-3.5" aria-hidden />}
      {children}
    </Button>
  );
}

function CompareGrid({
  labelBefore,
  labelAfter,
  before,
  after,
}: {
  labelBefore: string;
  labelAfter: string;
  before: React.ReactNode;
  after: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-background/80 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{labelBefore}</p>
        <div className="mt-2 text-sm leading-relaxed">{before}</div>
      </div>
      <div className="rounded-lg border border-primary/25 bg-primary/[0.04] p-3 ring-1 ring-primary/10">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{labelAfter}</p>
        <div className="mt-2 text-sm leading-relaxed">{after}</div>
      </div>
    </div>
  );
}

export function SummaryJobTailorSection({
  projectId,
  state,
  setState,
  hasSavedJobTarget,
  tailoringCompare,
  setTailoringCompare,
}: {
  projectId: string;
  state: WizardStateV1;
  setState: Dispatch<SetStateAction<WizardStateV1>>;
  hasSavedJobTarget: boolean;
  tailoringCompare: TailoringCompareV1 | null;
  setTailoringCompare: Dispatch<SetStateAction<TailoringCompareV1 | null>>;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const slice = tailoringCompare?.summary;

  const runTailor = () => {
    setError(null);
    start(() => {
      void (async () => {
        const res = await tailorSummaryToJobAction({
          projectId,
          headline: state.summary.headline,
          summary: state.summary.summary,
        });
        if (res.ok) {
          setTailoringCompare(res.data.tailoringCompare);
        } else {
          setError(tailorFailureMessage(res));
        }
      })();
    });
  };

  const accept = () => {
    if (!slice?.after) return;
    setError(null);
    start(() => {
      void (async () => {
        const res = await acceptTailoredSummaryAction({ projectId });
        if (res.ok) {
          setState((s) => ({
            ...s,
            summary: {
              headline: slice.after.headline,
              summary: slice.after.summary,
            },
          }));
          setTailoringCompare((c) => dropSummary(c));
        } else {
          setError(tailorFailureMessage(res));
        }
      })();
    });
  };

  const reject = () => {
    setError(null);
    start(() => {
      void (async () => {
        const res = await rejectTailoredSummaryAction({ projectId });
        if (res.ok) {
          setTailoringCompare((c) => dropSummary(c));
        } else {
          setError(tailorFailureMessage(res));
        }
      })();
    });
  };

  return (
    <div className="mt-6 space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 ring-1 ring-foreground/5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Match saved posting</p>
        <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{AI_MATCH_SAVED_POSTING_LINE}</p>
      </div>
      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      ) : null}

      {!slice ? (
        <TailorButton
          pending={pending}
          disabled={!hasSavedJobTarget}
          onClick={runTailor}
        >
          Align profile to posting
        </TailorButton>
      ) : null}

      {!hasSavedJobTarget ? (
        <p className="text-caption text-muted-foreground">Save a job posting in Job posting (optional) first.</p>
      ) : null}

      {slice ? (
        <div className="space-y-3">
          <CompareGrid
            labelBefore="Your current version"
            labelAfter="Suggested for this posting"
            before={
              <>
                <p className="font-medium">{slice.before.headline || "—"}</p>
                <p className="mt-2 whitespace-pre-wrap">{slice.before.summary || "—"}</p>
              </>
            }
            after={
              <>
                <p className="font-medium">{slice.after.headline}</p>
                <p className="mt-2 whitespace-pre-wrap">{slice.after.summary}</p>
              </>
            }
          />
          <p className="text-caption text-muted-foreground">
            Suggested {new Date(slice.generatedAt).toLocaleString()}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="min-h-10 w-full sm:w-auto" onClick={reject} disabled={pending}>
              Keep my version
            </Button>
            <Button type="button" size="sm" className="min-h-10 w-full sm:w-auto" onClick={accept} disabled={pending}>
              Use suggested summary
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SkillsJobTailorSection({
  projectId,
  lines,
  setLines,
  hasSavedJobTarget,
  tailoringCompare,
  setTailoringCompare,
}: {
  projectId: string;
  lines: string;
  setLines: (lines: string) => void;
  hasSavedJobTarget: boolean;
  tailoringCompare: TailoringCompareV1 | null;
  setTailoringCompare: Dispatch<SetStateAction<TailoringCompareV1 | null>>;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const slice = tailoringCompare?.skills;

  const runTailor = () => {
    setError(null);
    start(() => {
      void (async () => {
        const res = await tailorSkillsToJobAction({
          projectId,
          lines,
        });
        if (res.ok) {
          setTailoringCompare(res.data.tailoringCompare);
        } else {
          setError(tailorFailureMessage(res));
        }
      })();
    });
  };

  const accept = () => {
    if (!slice?.after) return;
    setError(null);
    start(() => {
      void (async () => {
        const res = await acceptTailoredSkillsAction({ projectId });
        if (res.ok) {
          setLines(slice.after.lines);
          setTailoringCompare((c) => dropSkills(c));
        } else {
          setError(tailorFailureMessage(res));
        }
      })();
    });
  };

  const reject = () => {
    setError(null);
    start(() => {
      void (async () => {
        const res = await rejectTailoredSkillsAction({ projectId });
        if (res.ok) {
          setTailoringCompare((c) => dropSkills(c));
        } else {
          setError(tailorFailureMessage(res));
        }
      })();
    });
  };

  return (
    <div className="mt-6 space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 ring-1 ring-foreground/5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Match saved posting</p>
        <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{AI_MATCH_SAVED_POSTING_LINE}</p>
      </div>
      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      ) : null}

      {!slice ? (
        <TailorButton pending={pending} disabled={!hasSavedJobTarget} onClick={runTailor}>
          Align skills to posting
        </TailorButton>
      ) : null}

      {!hasSavedJobTarget ? (
        <p className="text-caption text-muted-foreground">Save a job posting in Job posting (optional) first.</p>
      ) : null}

      {slice ? (
        <div className="space-y-3">
          <CompareGrid
            labelBefore="Your current list"
            labelAfter="Suggested order and wording"
            before={<pre className="whitespace-pre-wrap font-mono text-sm">{slice.before.lines || "—"}</pre>}
            after={<pre className="whitespace-pre-wrap font-mono text-sm">{slice.after.lines}</pre>}
          />
          <p className="text-caption text-muted-foreground">
            Suggested {new Date(slice.generatedAt).toLocaleString()}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="min-h-10 w-full sm:w-auto" onClick={reject} disabled={pending}>
              Keep my list
            </Button>
            <Button type="button" size="sm" className="min-h-10 w-full sm:w-auto" onClick={accept} disabled={pending}>
              Use suggested skills
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ExperienceJobTailorSection({
  projectId,
  entry,
  onApplyBullets,
  hasSavedJobTarget,
  tailoringCompare,
  setTailoringCompare,
}: {
  projectId: string;
  entry: WorkExperienceEntry;
  onApplyBullets: (bullets: string[]) => void;
  hasSavedJobTarget: boolean;
  tailoringCompare: TailoringCompareV1 | null;
  setTailoringCompare: Dispatch<SetStateAction<TailoringCompareV1 | null>>;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const slice = tailoringCompare?.experience?.[entry.id];
  const bullets = entry.highlights.filter((b) => b.trim().length > 0);

  const runTailor = () => {
    setError(null);
    if (bullets.length === 0) {
      setError("Add at least one bullet first.");
      return;
    }
    start(() => {
      void (async () => {
        const res = await tailorExperienceToJobAction({
          projectId,
          entryId: entry.id,
          company: entry.company || "Company",
          title: entry.title || "Role",
          bullets: bullets.length ? bullets : [""],
        });
        if (res.ok) {
          setTailoringCompare(res.data.tailoringCompare);
        } else {
          setError(tailorFailureMessage(res));
        }
      })();
    });
  };

  const accept = () => {
    if (!slice?.after) return;
    setError(null);
    start(() => {
      void (async () => {
        const res = await acceptTailoredExperienceAction({ projectId, entryId: entry.id });
        if (res.ok) {
          onApplyBullets(slice.after.bullets.length ? slice.after.bullets : [""]);
          setTailoringCompare((c) => dropExperienceEntry(c, entry.id));
        } else {
          setError(tailorFailureMessage(res));
        }
      })();
    });
  };

  const reject = () => {
    setError(null);
    start(() => {
      void (async () => {
        const res = await rejectTailoredExperienceAction({ projectId, entryId: entry.id });
        if (res.ok) {
          setTailoringCompare((c) => dropExperienceEntry(c, entry.id));
        } else {
          setError(tailorFailureMessage(res));
        }
      })();
    });
  };

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/30 p-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Match saved posting — this role</p>
        <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{AI_MATCH_SAVED_POSTING_LINE}</p>
      </div>
      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      ) : null}

      {!slice ? (
        <TailorButton pending={pending} disabled={!hasSavedJobTarget} onClick={runTailor}>
          Align bullets to posting
        </TailorButton>
      ) : null}

      {!hasSavedJobTarget ? (
        <p className="text-caption text-muted-foreground">Save a job posting in Job posting (optional) first.</p>
      ) : null}

      {slice ? (
        <div className="space-y-3">
          <CompareGrid
            labelBefore="Your bullets"
            labelAfter="Suggested for this posting"
            before={
              <ul className="list-inside list-disc space-y-1">
                {slice.before.bullets.map((b, i) => (
                  <li key={`b-${i}`}>{b || "—"}</li>
                ))}
              </ul>
            }
            after={
              <ul className="list-inside list-disc space-y-1">
                {slice.after.bullets.map((b, i) => (
                  <li key={`a-${i}`}>{b}</li>
                ))}
              </ul>
            }
          />
          <p className="text-caption text-muted-foreground">
            Suggested {new Date(slice.generatedAt).toLocaleString()}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="min-h-10 w-full sm:w-auto" onClick={reject} disabled={pending}>
              Keep my bullets
            </Button>
            <Button type="button" size="sm" className="min-h-10 w-full sm:w-auto" onClick={accept} disabled={pending}>
              Use suggested bullets
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function dropSummary(c: TailoringCompareV1 | null): TailoringCompareV1 | null {
  if (!c) return null;
  const { summary: _s, ...rest } = c;
  void _s;
  const next = { ...rest, v: 1 as const } as TailoringCompareV1;
  if (!next.skills && !next.experience) return null;
  return next;
}

function dropSkills(c: TailoringCompareV1 | null): TailoringCompareV1 | null {
  if (!c) return null;
  const { skills: _sk, ...rest } = c;
  void _sk;
  const next = { ...rest, v: 1 as const } as TailoringCompareV1;
  if (!next.summary && !next.experience) return null;
  return next;
}

function dropExperienceEntry(
  c: TailoringCompareV1 | null,
  entryId: string,
): TailoringCompareV1 | null {
  if (!c?.experience?.[entryId]) return c;
  const { [entryId]: _, ...expRest } = c.experience;
  void _;
  const next: TailoringCompareV1 = {
    ...c,
    experience: Object.keys(expRest).length ? expRest : undefined,
  };
  if (!next.summary && !next.skills && !next.experience) return null;
  return next;
}
