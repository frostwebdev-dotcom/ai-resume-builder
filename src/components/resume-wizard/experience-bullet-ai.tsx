"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatAiAssistClientMessage } from "@/lib/ai/assist-client-copy";
import { cn } from "@/lib/utils";
import { logAiSuggestionAction } from "@/services/ai/actions";
import type { ExperienceBulletAssistAction } from "@/services/ai/prompts/user-messages";

type ApiOk = { ok: true; data: { bullet: string; improvementNote?: string } };
type ApiErr = { ok: false; error: string; code?: string; details?: unknown };

const ACTION_BUTTONS: { action: ExperienceBulletAssistAction; label: string }[] = [
  { action: "rewrite", label: "Rewrite" },
  { action: "professional", label: "More professional" },
  { action: "impact", label: "Add impact" },
  { action: "concise", label: "Concise" },
  { action: "grammar", label: "Grammar" },
];

function BulletReviewBody({
  loading,
  loadingMessage,
  error,
  original,
  suggested,
  note,
  editing,
  onChangeSuggested,
}: {
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  original: string;
  suggested: string | null;
  note: string | null;
  editing: boolean;
  onChangeSuggested: (v: string) => void;
}) {
  if (loading && !suggested) {
    return (
      <div className="flex min-h-[10rem] flex-col items-center justify-center gap-3 px-2 py-8 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-base font-medium text-foreground">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original</p>
        <div className="rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-4">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">{original || "—"}</p>
        </div>
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested</p>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        ) : null}
        {suggested !== null ? (
          editing ? (
            <div className="rounded-lg border border-primary/30 bg-background p-3 sm:p-4">
              <Label htmlFor="exp-ai-bullet-edit" className="sr-only">
                Edit suggested bullet
              </Label>
              <Textarea
                id="exp-ai-bullet-edit"
                value={suggested}
                onChange={(e) => onChangeSuggested(e.target.value)}
                rows={6}
                className="min-h-[8rem] resize-y text-base leading-relaxed"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 sm:p-4">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">{suggested}</p>
            </div>
          )
        ) : !loading ? (
          <p className="text-sm text-muted-foreground">No suggestion yet.</p>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            {loadingMessage}
          </div>
        )}
        {note ? (
          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Note: </span>
            {note}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BulletReviewFooter({
  loading,
  suggested,
  editing,
  onToggleEdit,
  onAccept,
  onRegenerate,
  onCancel,
}: {
  loading: boolean;
  suggested: string | null;
  editing: boolean;
  onToggleEdit: () => void;
  onAccept: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
}) {
  const canAccept = Boolean(suggested && suggested.trim().length > 0);
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end", "pt-2")}>
      <Button
        type="button"
        variant="outline"
        className="w-full min-h-[var(--touch-target-min)] sm:w-auto"
        onClick={onCancel}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full min-h-[var(--touch-target-min)] sm:w-auto"
        onClick={onRegenerate}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Working…
          </>
        ) : (
          "Regenerate"
        )}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full min-h-[var(--touch-target-min)] sm:w-auto"
        onClick={onToggleEdit}
        disabled={loading || suggested === null}
      >
        {editing ? "Done editing" : "Edit"}
      </Button>
      <Button
        type="button"
        className="w-full min-h-[var(--touch-target-min)] sm:w-auto"
        onClick={onAccept}
        disabled={loading || !canAccept}
      >
        Accept
      </Button>
    </div>
  );
}

function BulletReviewShell(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  original: string;
  suggested: string | null;
  note: string | null;
  editing: boolean;
  onChangeSuggested: (v: string) => void;
  onToggleEdit: () => void;
  onAccept: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const title = "Review bullet suggestion";

  if (isDesktop) {
    return (
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="flex max-h-[min(90vh,880px)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Your bullet stays until you accept.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <BulletReviewBody
              loading={props.loading}
              loadingMessage={props.loadingMessage}
              error={props.error}
              original={props.original}
              suggested={props.suggested}
              note={props.note}
              editing={props.editing}
              onChangeSuggested={props.onChangeSuggested}
            />
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-4 py-4 sm:px-6">
            <BulletReviewFooter
              loading={props.loading}
              suggested={props.suggested}
              editing={props.editing}
              onToggleEdit={props.onToggleEdit}
              onAccept={props.onAccept}
              onRegenerate={props.onRegenerate}
              onCancel={props.onCancel}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={!props.loading}
        className="flex h-[min(96dvh,100vh)] max-h-[min(96dvh,100vh)] flex-col gap-0 overflow-hidden rounded-t-xl p-0 sm:max-w-none"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 pb-3 pt-4 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Compare before replacing your bullet.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <BulletReviewBody
            loading={props.loading}
            loadingMessage={props.loadingMessage}
            error={props.error}
            original={props.original}
            suggested={props.suggested}
            note={props.note}
            editing={props.editing}
            onChangeSuggested={props.onChangeSuggested}
          />
        </div>
        <SheetFooter className="shrink-0 border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <BulletReviewFooter
            loading={props.loading}
            suggested={props.suggested}
            editing={props.editing}
            onToggleEdit={props.onToggleEdit}
            onAccept={props.onAccept}
            onRegenerate={props.onRegenerate}
            onCancel={props.onCancel}
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

type Props = {
  projectId: string;
  entryId: string;
  company: string;
  title: string;
  bullet: string;
  highlightIndex: number;
  targetRoleHint?: string;
  onApplyBullet: (text: string) => void;
};

export function ExperienceBulletAiControls({
  projectId,
  entryId,
  company,
  title,
  bullet,
  highlightIndex,
  targetRoleHint,
  onApplyBullet,
}: Props) {
  const bulletRef = useRef(bullet);
  useEffect(() => {
    bulletRef.current = bullet;
  }, [bullet]);

  const [, start] = useTransition();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalSnap, setOriginalSnap] = useState("");
  const [suggested, setSuggested] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeUiAction, setActiveUiAction] = useState<ExperienceBulletAssistAction | null>(null);
  const activeActionRef = useRef<ExperienceBulletAssistAction | null>(null);
  const closedByAcceptRef = useRef(false);

  const reset = () => {
    setReviewOpen(false);
    setLoading(false);
    setError(null);
    setOriginalSnap("");
    setSuggested(null);
    setNote(null);
    setEditing(false);
    activeActionRef.current = null;
    setActiveUiAction(null);
  };

  const dismiss = () => {
    if (!closedByAcceptRef.current) {
      const a = activeActionRef.current;
      if (a) {
        void logAiSuggestionAction({
          projectId,
          kind: "experience.bullet",
          metadata: { status: "dismissed", action: a, entryId, highlightIndex },
        });
      }
    }
    closedByAcceptRef.current = false;
    reset();
  };

  const runAssist = (action: ExperienceBulletAssistAction, opts?: { preserveOriginal?: boolean }) => {
    const b = bulletRef.current.trim();
    if (b.length < 1) return;
    setError(null);
    if (!opts?.preserveOriginal) {
      setOriginalSnap(b);
    }
    activeActionRef.current = action;
    setActiveUiAction(action);
    setSuggested(null);
    setNote(null);
    setEditing(false);
    setReviewOpen(true);
    setLoading(true);

    start(() => {
      void (async () => {
        const body = {
          projectId,
          entryId,
          company,
          title,
          bullet: b,
          action,
          targetRoleHint: targetRoleHint?.trim() || undefined,
        };
        try {
          const res = await fetch("/api/ai/experience-bullet", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const json = (await res.json()) as ApiOk | ApiErr;
          if (!json.ok) {
            setError(formatAiAssistClientMessage(json.error, json.code));
          } else {
            setSuggested(json.data.bullet);
            setNote(json.data.improvementNote?.trim() || null);
          }
        } catch {
          setError(formatAiAssistClientMessage("Request failed. Try again."));
        } finally {
          setLoading(false);
        }
      })();
    });
  };

  const handleAccept = () => {
    const a = activeActionRef.current;
    const text = suggested?.trim();
    if (!text || !a) return;
    onApplyBullet(text);
    void logAiSuggestionAction({
      projectId,
      kind: "experience.bullet",
      metadata: { status: "accepted", action: a, entryId, highlightIndex },
    });
    closedByAcceptRef.current = true;
    reset();
  };

  const handleRegenerate = () => {
    const a = activeActionRef.current;
    if (!a) return;
    runAssist(a, { preserveOriginal: true });
  };

  const canRunAi = bullet.trim().length > 0;
  const loadingMessage = "Improving your bullet…";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {ACTION_BUTTONS.map(({ action, label }) => (
          <Button
            key={action}
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs sm:text-sm"
            disabled={!canRunAi || (loading && activeUiAction === action)}
            onClick={() => runAssist(action)}
          >
            {loading && activeUiAction === action ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-3.5 opacity-70" aria-hidden />
            )}
            {label}
          </Button>
        ))}
      </div>
      {!canRunAi ? (
        <p className="text-[0.65rem] text-muted-foreground">Add text to this bullet to use AI.</p>
      ) : null}

      <BulletReviewShell
        open={reviewOpen}
        onOpenChange={(o) => {
          if (!o) dismiss();
        }}
        loading={loading}
        loadingMessage={loadingMessage}
        error={error}
        original={originalSnap}
        suggested={suggested}
        note={note}
        editing={editing}
        onChangeSuggested={setSuggested}
        onToggleEdit={() => setEditing((v) => !v)}
        onAccept={handleAccept}
        onRegenerate={handleRegenerate}
        onCancel={() => setReviewOpen(false)}
      />
    </div>
  );
}
