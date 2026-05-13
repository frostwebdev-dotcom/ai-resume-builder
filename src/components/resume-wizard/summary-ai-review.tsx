"use client";

import { Loader2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export type SummarySnapshot = {
  headline: string;
  summary: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  original: SummarySnapshot | null;
  suggestedDraft: SummarySnapshot | null;
  onChangeSuggested: (next: SummarySnapshot) => void;
  isEditingSuggested: boolean;
  onToggleEdit: () => void;
  onAccept: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
};

function ReviewBody({
  loading,
  loadingMessage,
  error,
  original,
  suggestedDraft,
  onChangeSuggested,
  isEditingSuggested,
}: Pick<
  Props,
  | "loading"
  | "loadingMessage"
  | "error"
  | "original"
  | "suggestedDraft"
  | "onChangeSuggested"
  | "isEditingSuggested"
>) {
  if (loading && !suggestedDraft) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 px-2 py-8 text-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-base font-medium text-foreground">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your current version</p>
        {original ? (
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 sm:p-4">
            <p className="text-sm font-medium text-foreground">{original.headline || "—"}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{original.summary || "—"}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing captured.</p>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested</p>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        ) : null}
        {suggestedDraft ? (
          isEditingSuggested ? (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-background p-3 sm:p-4">
              <div className="space-y-1.5">
                <Label htmlFor="ai-suggested-headline">Headline</Label>
                <Input
                  id="ai-suggested-headline"
                  value={suggestedDraft.headline}
                  onChange={(e) => onChangeSuggested({ ...suggestedDraft, headline: e.target.value })}
                  className="text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-suggested-summary">Summary</Label>
                <Textarea
                  id="ai-suggested-summary"
                  value={suggestedDraft.summary}
                  onChange={(e) => onChangeSuggested({ ...suggestedDraft, summary: e.target.value })}
                  rows={8}
                  className="min-h-[10rem] resize-y text-base leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 sm:p-4">
              <p className="text-sm font-medium text-foreground">{suggestedDraft.headline || "—"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{suggestedDraft.summary}</p>
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
      </div>
    </div>
  );
}

function ReviewFooter({
  loading,
  suggestedDraft,
  isEditingSuggested,
  onToggleEdit,
  onAccept,
  onRegenerate,
  onCancel,
}: Pick<
  Props,
  "loading" | "suggestedDraft" | "isEditingSuggested" | "onToggleEdit" | "onAccept" | "onRegenerate" | "onCancel"
>) {
  const canAccept = Boolean(
    suggestedDraft && (suggestedDraft.summary.trim().length > 0 || suggestedDraft.headline.trim().length > 0),
  );
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end",
        "pt-2",
      )}
    >
      <Button type="button" variant="outline" className="w-full min-h-11 sm:w-auto" onClick={onCancel} disabled={loading}>
        Cancel
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full min-h-11 sm:w-auto"
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
        className="w-full min-h-11 sm:w-auto"
        onClick={onToggleEdit}
        disabled={loading || !suggestedDraft}
      >
        {isEditingSuggested ? "Done editing" : "Edit"}
      </Button>
      <Button type="button" className="w-full min-h-11 sm:w-auto" onClick={onAccept} disabled={loading || !canAccept}>
        Accept
      </Button>
    </div>
  );
}

/**
 * Mobile: bottom sheet, sticky footer, readable single-column comparison (stacks on small screens).
 * Desktop: dialog; optional two-column layout from `lg:grid` inside body only.
 */
export function SummaryAiReviewLayout(props: Props) {
  const {
    open,
    onOpenChange,
    loading,
    loadingMessage,
    error,
    original,
    suggestedDraft,
    onChangeSuggested,
    isEditingSuggested,
    onToggleEdit,
    onAccept,
    onRegenerate,
    onCancel,
  } = props;

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const title = "Review AI suggestion";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(90vh,900px)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Compare with your current text. Nothing changes until you tap Accept.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <ReviewBody
              loading={loading}
              loadingMessage={loadingMessage}
              error={error}
              original={original}
              suggestedDraft={suggestedDraft}
              onChangeSuggested={onChangeSuggested}
              isEditingSuggested={isEditingSuggested}
            />
          </div>
          <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-4 py-4 sm:px-6">
            <ReviewFooter
              loading={loading}
              suggestedDraft={suggestedDraft}
              isEditingSuggested={isEditingSuggested}
              onToggleEdit={onToggleEdit}
              onAccept={onAccept}
              onRegenerate={onRegenerate}
              onCancel={onCancel}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={!loading}
        className="flex h-[min(96dvh,100vh)] max-h-[min(96dvh,100vh)] flex-col gap-0 overflow-hidden rounded-t-xl p-0 sm:max-w-none"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 pb-3 pt-4 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Your draft stays until you accept.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <ReviewBody
            loading={loading}
            loadingMessage={loadingMessage}
            error={error}
            original={original}
            suggestedDraft={suggestedDraft}
            onChangeSuggested={onChangeSuggested}
            isEditingSuggested={isEditingSuggested}
          />
        </div>
        <SheetFooter className="shrink-0 border-t border-border bg-background px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <ReviewFooter
            loading={loading}
            suggestedDraft={suggestedDraft}
            isEditingSuggested={isEditingSuggested}
            onToggleEdit={onToggleEdit}
            onAccept={onAccept}
            onRegenerate={onRegenerate}
            onCancel={onCancel}
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
