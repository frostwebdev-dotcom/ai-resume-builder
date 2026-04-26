"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { AiResult } from "@/types/ai";

import type {
  WorkExperienceEntry,
  WizardStateV1,
} from "@/lib/resume-wizard/types";
import {
  aiExpandExperienceBulletsAction,
  aiExpandSummaryAction,
  aiGenerateSummaryAction,
  aiGrammarAdditionalAction,
  aiGrammarSummaryAction,
  aiRephraseSkillsAction,
  aiRewriteExperienceBulletsAction,
  aiShortenExperienceBulletsAction,
  aiShortenSkillsAction,
  aiShortenSummaryAction,
  aiStrengthenExperienceBulletsAction,
  aiTailorSummaryAction,
} from "@/services/ai/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AI_ASSIST_ADDITIONAL_LINE,
  AI_ASSIST_EXPERIENCE_LINE,
  AI_ASSIST_FAIR_USE_LINE,
  AI_ASSIST_PROFILE_LINE,
  AI_ASSIST_PROFILE_ROLE_LINE,
  AI_ASSIST_SKILLS_LINE,
  formatAiAssistClientMessage,
} from "@/lib/ai/assist-client-copy";
import { cn } from "@/lib/utils";

type PanelProps = {
  projectId: string;
  className?: string;
};

function AiButton({
  children,
  pending,
  disabled,
  onClick,
}: {
  children: ReactNode;
  pending?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-10 justify-center gap-1.5 text-xs sm:min-h-9 sm:text-sm"
      disabled={disabled || pending}
      onClick={onClick}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Sparkles className="size-3.5 opacity-70" aria-hidden />
      )}
      {children}
    </Button>
  );
}

export function SummaryAiPanel({
  projectId,
  state,
  setState,
  className,
}: PanelProps & {
  state: WizardStateV1;
  setState: React.Dispatch<React.SetStateAction<WizardStateV1>>;
}) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, start] = useTransition();
  const [targetRole, setTargetRole] = useState("");
  const [jobFocus, setJobFocus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (
    key: string,
    promise: Promise<AiResult<{ headline: string; summary: string }>>,
  ) => {
    setError(null);
    setPendingKey(key);
    start(() => {
      void (async () => {
        try {
          const res = await promise;
          if (res.ok) {
            setState((s) => ({
              ...s,
              summary: {
                headline: res.data.headline,
                summary: res.data.summary,
              },
            }));
          } else {
            setError(formatAiAssistClientMessage(res.error, res.code));
          }
        } catch {
          setError(formatAiAssistClientMessage("Request failed. Try again."));
        } finally {
          setPendingKey(null);
        }
      })();
    });
  };

  const s = state.summary;
  const p = state.personal;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-muted/30 p-4 ring-1 ring-foreground/5",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        AI assist
      </p>
      <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{AI_ASSIST_PROFILE_LINE}</p>
      {error ? (
        <Alert variant="destructive" className="mt-2 py-2">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <AiButton
          pending={pendingKey === "gen"}
          onClick={() =>
            run(
              "gen",
              aiGenerateSummaryAction({
                projectId,
                headline: s.headline,
                existingSummary: s.summary,
                notes: [p.fullName, p.email, p.location].filter(Boolean).join(" · "),
              }),
            )
          }
        >
          Generate profile
        </AiButton>
        <AiButton
          pending={pendingKey === "short"}
          onClick={() =>
            run(
              "short",
              aiShortenSummaryAction({
                projectId,
                headline: s.headline,
                summary: s.summary,
              }),
            )
          }
        >
          Shorten
        </AiButton>
        <AiButton
          pending={pendingKey === "exp"}
          onClick={() =>
            run(
              "exp",
              aiExpandSummaryAction({
                projectId,
                headline: s.headline,
                summary: s.summary,
              }),
            )
          }
        >
          Expand
        </AiButton>
        <AiButton
          pending={pendingKey === "gram"}
          onClick={() =>
            run(
              "gram",
              aiGrammarSummaryAction({
                projectId,
                headline: s.headline,
                summary: s.summary,
              }),
            )
          }
        >
          Grammar & clarity
        </AiButton>
      </div>

      <div className="mt-6 space-y-3 border-t border-border/60 pt-4">
        <p className="text-[0.7rem] leading-snug text-muted-foreground">{AI_ASSIST_PROFILE_ROLE_LINE}</p>
        <Field id="target-role" label="Target role (for Improve)" description="Required for this AI assist action.">
          <Input
            id="target-role"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior frontend engineer — fintech"
            className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          />
        </Field>
        <Field id="job-focus" label="Job description or keywords (optional)">
          <Textarea
            id="job-focus"
            value={jobFocus}
            onChange={(e) => setJobFocus(e.target.value)}
            className="min-h-[5rem] text-sm"
            placeholder="Paste a short job description or list must-have skills."
          />
        </Field>
        <AiButton
          pending={pendingKey === "tailor"}
          disabled={targetRole.trim().length < 3}
          onClick={() =>
            run(
              "tailor",
              aiTailorSummaryAction({
                projectId,
                headline: s.headline,
                summary: s.summary,
                targetRole: targetRole.trim(),
                jobFocus: jobFocus.trim() || undefined,
              }),
            )
          }
        >
          Align to role
        </AiButton>
      </div>

      <p className="mt-4 border-t border-border/60 pt-3 text-[0.65rem] leading-snug text-muted-foreground">
        {AI_ASSIST_FAIR_USE_LINE}
      </p>
    </div>
  );
}

export function ExperienceEntryAiPanel({
  projectId,
  entry,
  onApplyBullets,
  className,
}: PanelProps & {
  entry: WorkExperienceEntry;
  onApplyBullets: (bullets: string[]) => void;
}) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const bullets = entry.highlights.filter((b) => b.trim().length > 0);
  const canRun = bullets.length > 0;

  const run = (
    key: string,
    promise: Promise<AiResult<{ bullets: string[] }>>,
  ) => {
    setError(null);
    if (!canRun) {
      setError("Add at least one bullet first.");
      return;
    }
    setPendingKey(key);
    start(() => {
      void (async () => {
        try {
          const res = await promise;
          if (res.ok) {
            onApplyBullets(res.data.bullets);
          } else {
            setError(formatAiAssistClientMessage(res.error, res.code));
          }
        } catch {
          setError(formatAiAssistClientMessage("Request failed. Try again."));
        } finally {
          setPendingKey(null);
        }
      })();
    });
  };

  const payload = {
    projectId,
    entryId: entry.id,
    company: entry.company || "Company",
    title: entry.title || "Role",
    bullets: bullets.length ? bullets : [""],
  };

  return (
    <div className={cn("mt-4 space-y-2 rounded-lg bg-muted/40 p-3", className)}>
      <p className="text-xs font-medium text-muted-foreground">AI assist for this role</p>
      <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{AI_ASSIST_EXPERIENCE_LINE}</p>
      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <AiButton
          pending={pendingKey === "rw"}
          disabled={!canRun}
          onClick={() => run("rw", aiRewriteExperienceBulletsAction(payload))}
        >
          Rewrite bullets
        </AiButton>
        <AiButton
          pending={pendingKey === "str"}
          disabled={!canRun}
          onClick={() => run("str", aiStrengthenExperienceBulletsAction(payload))}
        >
          Strengthen wins
        </AiButton>
        <AiButton
          pending={pendingKey === "sh"}
          disabled={!canRun}
          onClick={() => run("sh", aiShortenExperienceBulletsAction(payload))}
        >
          Shorten
        </AiButton>
        <AiButton
          pending={pendingKey === "ex"}
          disabled={!canRun}
          onClick={() => run("ex", aiExpandExperienceBulletsAction(payload))}
        >
          Expand
        </AiButton>
      </div>
      <p className="mt-2 text-[0.65rem] leading-snug text-muted-foreground">{AI_ASSIST_FAIR_USE_LINE}</p>
    </div>
  );
}

export function SkillsAiPanel({
  projectId,
  lines,
  onApplyLines,
  className,
}: PanelProps & {
  lines: string;
  onApplyLines: (lines: string) => void;
}) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (key: string, promise: Promise<AiResult<{ lines: string }>>) => {
    setError(null);
    setPendingKey(key);
    start(() => {
      void (async () => {
        try {
          const res = await promise;
          if (res.ok) {
            onApplyLines(res.data.lines);
          } else {
            setError(formatAiAssistClientMessage(res.error, res.code));
          }
        } catch {
          setError(formatAiAssistClientMessage("Request failed. Try again."));
        } finally {
          setPendingKey(null);
        }
      })();
    });
  };

  return (
    <div
      className={cn(
        "mt-4 rounded-xl border border-border/80 bg-muted/30 p-4 ring-1 ring-foreground/5",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        AI assist
      </p>
      <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{AI_ASSIST_SKILLS_LINE}</p>
      {error ? (
        <Alert variant="destructive" className="mt-2 py-2">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <AiButton
          pending={pendingKey === "re"}
          onClick={() =>
            run(
              "re",
              aiRephraseSkillsAction({
                projectId,
                lines,
              }),
            )
          }
        >
          Improve phrasing
        </AiButton>
        <AiButton
          pending={pendingKey === "sh"}
          onClick={() =>
            run(
              "sh",
              aiShortenSkillsAction({
                projectId,
                lines,
              }),
            )
          }
        >
          Shorten list
        </AiButton>
      </div>
      <p className="mt-3 text-[0.65rem] leading-snug text-muted-foreground">{AI_ASSIST_FAIR_USE_LINE}</p>
    </div>
  );
}

export function AdditionalAiPanel({
  projectId,
  text,
  onApply,
  className,
}: PanelProps & {
  text: string;
  onApply: (text: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "mt-4 rounded-xl border border-border/80 bg-muted/30 p-4 ring-1 ring-foreground/5",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        AI assist
      </p>
      <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{AI_ASSIST_ADDITIONAL_LINE}</p>
      {error ? (
        <Alert variant="destructive" className="mt-2 py-2">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="mt-3">
        <AiButton
          pending={pending}
          onClick={() => {
            setError(null);
            setPending(true);
            start(() => {
              void (async () => {
                try {
                  const res = await aiGrammarAdditionalAction({
                    projectId,
                    text,
                  });
                  if (res.ok) {
                    onApply(res.data.text);
                  } else {
                    setError(formatAiAssistClientMessage(res.error, res.code));
                  }
                } catch {
                  setError(formatAiAssistClientMessage("Request failed. Try again."));
                } finally {
                  setPending(false);
                }
              })();
            });
          }}
        >
          Grammar & clarity
        </AiButton>
      </div>
      <p className="mt-3 text-[0.65rem] leading-snug text-muted-foreground">{AI_ASSIST_FAIR_USE_LINE}</p>
    </div>
  );
}
