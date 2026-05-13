"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { AiResult } from "@/types/ai";

import type {
  EducationEntry,
  WizardStateV1,
} from "@/lib/resume-wizard/types";
import {
  aiGenerateSummaryAction,
  aiGrammarAdditionalAction,
  aiImproveSummaryAction,
  aiPolishEducationDetailsAction,
  aiProfessionalSummaryAction,
  aiRephraseSkillsAction,
  aiShortenSkillsAction,
  aiShortenSummaryAction,
  aiTailorSummaryAction,
  logAiSuggestionAction,
} from "@/services/ai/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AI_ASSIST_ADDITIONAL_LINE,
  AI_ASSIST_EDUCATION_LINE,
  AI_ASSIST_FAIR_USE_LINE,
  AI_ASSIST_PROFILE_LINE,
  AI_ASSIST_PROFILE_ROLE_LINE,
  AI_ASSIST_SKILLS_LINE,
  formatAiAssistClientMessage,
} from "@/lib/ai/assist-client-copy";
import { SummaryAiReviewLayout } from "@/components/resume-wizard/summary-ai-review";
import { buildSummaryGenerationNotes } from "@/lib/resume-wizard/summary-ai-context";
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
      size="default"
      className="min-h-11 w-full justify-center gap-2 text-sm sm:w-auto sm:min-h-10 sm:text-sm"
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

type SummaryAiActionKey = "generate" | "improve" | "shorten" | "professional" | "tailor";

function targetRoleHintFromState(w: WizardStateV1): string | undefined {
  const d = w.personal.desiredJobPosition.trim();
  if (d.length >= 3) return d;
  const h = w.summary.headline.trim();
  if (h.length >= 3) return h;
  return undefined;
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
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [, start] = useTransition();
  const [targetRole, setTargetRole] = useState("");
  const [jobFocus, setJobFocus] = useState("");

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [originalSnap, setOriginalSnap] = useState<{ headline: string; summary: string } | null>(null);
  const [suggestedDraft, setSuggestedDraft] = useState<{ headline: string; summary: string } | null>(null);
  const [activeAction, setActiveAction] = useState<SummaryAiActionKey | null>(null);
  const [editingSuggested, setEditingSuggested] = useState(false);
  const activeActionRef = useRef<SummaryAiActionKey | null>(null);
  const closedByAcceptRef = useRef(false);

  const resetReview = () => {
    setReviewOpen(false);
    setReviewLoading(false);
    setReviewError(null);
    setOriginalSnap(null);
    setSuggestedDraft(null);
    setActiveAction(null);
    activeActionRef.current = null;
    setEditingSuggested(false);
  };

  const logSuggestion = (status: "accepted" | "dismissed", actionKey: SummaryAiActionKey) => {
    void logAiSuggestionAction({
      projectId,
      kind: "summary.suggestion",
      metadata: { status, actionKey },
    });
  };

  const dismissReview = () => {
    if (!closedByAcceptRef.current) {
      const key = activeActionRef.current;
      if (key) logSuggestion("dismissed", key);
    }
    closedByAcceptRef.current = false;
    resetReview();
  };

  const runSummaryAi = (action: SummaryAiActionKey, opts?: { preserveOriginal?: boolean }) => {
    const live = stateRef.current;
    setReviewError(null);
    if (!opts?.preserveOriginal) {
      setOriginalSnap({
        headline: live.summary.headline,
        summary: live.summary.summary,
      });
    }
    setActiveAction(action);
    activeActionRef.current = action;
    setSuggestedDraft(null);
    setEditingSuggested(false);
    setReviewOpen(true);
    setReviewLoading(true);

    start(() => {
      void (async () => {
        const thr = targetRoleHintFromState(live);
        const base = {
          projectId,
          headline: live.summary.headline,
          summary: live.summary.summary,
        };
        try {
          let res: AiResult<{ headline: string; summary: string }>;
          switch (action) {
            case "generate":
              res = await aiGenerateSummaryAction({
                projectId,
                headline: live.summary.headline,
                existingSummary: live.summary.summary,
                notes: buildSummaryGenerationNotes(live),
              });
              break;
            case "improve":
              res = await aiImproveSummaryAction({
                ...base,
                targetRoleHint: thr,
              });
              break;
            case "shorten":
              res = await aiShortenSummaryAction(base);
              break;
            case "professional":
              res = await aiProfessionalSummaryAction({
                ...base,
                targetRoleHint: thr,
              });
              break;
            case "tailor":
              res = await aiTailorSummaryAction({
                projectId,
                headline: live.summary.headline,
                summary: live.summary.summary,
                targetRole: targetRole.trim(),
                jobFocus: jobFocus.trim() || undefined,
              });
              break;
          }
          if (res.ok) {
            setSuggestedDraft({ headline: res.data.headline, summary: res.data.summary });
          } else {
            setReviewError(formatAiAssistClientMessage(res.error, res.code));
          }
        } catch {
          setReviewError(formatAiAssistClientMessage("Request failed. Try again."));
        } finally {
          setReviewLoading(false);
        }
      })();
    });
  };

  const handleAccept = () => {
    if (!suggestedDraft || !activeActionRef.current) return;
    const key = activeActionRef.current;
    setState((s) => ({
      ...s,
      summary: { headline: suggestedDraft.headline, summary: suggestedDraft.summary },
    }));
    logSuggestion("accepted", key);
    closedByAcceptRef.current = true;
    resetReview();
  };

  const handleRegenerate = () => {
    const key = activeActionRef.current;
    if (!key) return;
    runSummaryAi(key, { preserveOriginal: true });
  };

  const loadingMessage = "Generating your professional summary…";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-muted/30 p-4 ring-1 ring-foreground/5",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        AI assist — Professional summary
      </p>
      <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{AI_ASSIST_PROFILE_LINE}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <AiButton pending={reviewLoading && activeAction === "generate"} onClick={() => runSummaryAi("generate")}>
          Generate summary
        </AiButton>
        <AiButton pending={reviewLoading && activeAction === "improve"} onClick={() => runSummaryAi("improve")}>
          Improve summary
        </AiButton>
        <AiButton pending={reviewLoading && activeAction === "shorten"} onClick={() => runSummaryAi("shorten")}>
          Make shorter
        </AiButton>
        <AiButton
          pending={reviewLoading && activeAction === "professional"}
          onClick={() => runSummaryAi("professional")}
        >
          Make more professional
        </AiButton>
      </div>

      <div className="mt-6 space-y-3 border-t border-border/60 pt-4">
        <p className="text-[0.7rem] leading-snug text-muted-foreground">{AI_ASSIST_PROFILE_ROLE_LINE}</p>
        <Field id="target-role" label="Target role (for Align to posting)" description="Required for this action.">
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
          pending={reviewLoading && activeAction === "tailor"}
          disabled={targetRole.trim().length < 3}
          onClick={() => runSummaryAi("tailor")}
        >
          Align to role
        </AiButton>
      </div>

      <p className="mt-4 border-t border-border/60 pt-3 text-[0.65rem] leading-snug text-muted-foreground">
        {AI_ASSIST_FAIR_USE_LINE}
      </p>

      <SummaryAiReviewLayout
        open={reviewOpen}
        onOpenChange={(open) => {
          if (!open) dismissReview();
        }}
        loading={reviewLoading}
        loadingMessage={loadingMessage}
        error={reviewError}
        original={originalSnap}
        suggestedDraft={suggestedDraft}
        onChangeSuggested={setSuggestedDraft}
        isEditingSuggested={editingSuggested}
        onToggleEdit={() => setEditingSuggested((v) => !v)}
        onAccept={handleAccept}
        onRegenerate={handleRegenerate}
        onCancel={() => setReviewOpen(false)}
      />
    </div>
  );
}

export function EducationEntryAiPanel({
  projectId,
  entry,
  onApplyDetails,
  className,
}: PanelProps & {
  entry: EducationEntry;
  onApplyDetails: (details: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasContext =
    entry.school.trim().length > 1 ||
    entry.degree.trim().length > 1 ||
    entry.field.trim().length > 1 ||
    entry.details.trim().length > 3;

  return (
    <div className={cn("mt-4 space-y-2 rounded-lg bg-muted/40 p-3", className)}>
      <p className="text-xs font-medium text-muted-foreground">AI assist for this school</p>
      <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{AI_ASSIST_EDUCATION_LINE}</p>
      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <AiButton
          pending={pending}
          disabled={!hasContext}
          onClick={() => {
            setError(null);
            setPending(true);
            start(() => {
              void (async () => {
                try {
                  const res = await aiPolishEducationDetailsAction({
                    projectId,
                    entryId: entry.id,
                    school: entry.school,
                    degree: entry.degree,
                    field: entry.field,
                    details: entry.details,
                  });
                  if (res.ok) {
                    onApplyDetails(res.data.details);
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
          Polish details
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
