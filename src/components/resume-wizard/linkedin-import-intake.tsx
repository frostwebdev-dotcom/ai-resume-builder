"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileType2, Loader2, X } from "lucide-react";

import { useResumeFileImport } from "./use-resume-file-import";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * LinkedIn exposes no public API for reading a member's own work history, and scraping a
 * profile URL breaks their User Agreement. The supported route is the member exporting their
 * own profile ("Save to PDF"), which we then run through the same AI import used for résumé
 * uploads. This component walks the user through that export and hands the file to that pipeline.
 */

const PROFILE_URL = "https://www.linkedin.com/in/me/";

const STEPS = [
  {
    title: "Open your LinkedIn profile",
    body: "On desktop, go to Me, then View Profile. On mobile, tap your photo, then View Profile.",
  },
  {
    title: "Choose Save to PDF",
    body: "Under your headline, open Resources (older layouts show More), then pick Save to PDF.",
  },
  {
    title: "Upload the PDF here",
    body: "We read the text with AI and fill in your draft. The file itself is never stored.",
  },
];

type Props = {
  templateSlug: TemplateSlug;
  onImported: (wizard: WizardStateV1) => void;
  cardClassName: string;
  /** Layout of the card face: stacked for the 3-up intake grid, row for the start-method list. */
  layout: "stacked" | "row";
  onCardOpen?: () => void;
};

export function LinkedInImportIntake({
  templateSlug,
  onImported,
  cardClassName,
  layout,
  onCardOpen,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleImported = useCallback(
    (wizard: WizardStateV1) => {
      setOpen(false);
      onImported(wizard);
    },
    [onImported],
  );

  const {
    inputId,
    inputRef,
    accept,
    selected,
    fileMeta,
    validationError,
    importError,
    pending,
    onPickerChange,
    openPicker,
    clearSelection,
    confirmImport,
  } = useResumeFileImport({ templateSlug, onImported: handleImported, pdfOnly: true });

  const onOpenChange = useCallback(
    (next: boolean) => {
      if (pending) return;
      if (!next) clearSelection();
      setOpen(next);
    },
    [clearSelection, pending],
  );

  const handleCardClick = useCallback(() => {
    onCardOpen?.();
    setOpen(true);
  }, [onCardOpen]);

  // Enter confirms once a file is chosen, matching the résumé upload dialog.
  useEffect(() => {
    if (!open || !selected || pending) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmImport();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmImport, open, selected, pending]);

  const badge = (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-[#0a66c2]/10 ring-1 ring-[#0a66c2]/15 transition-colors group-hover:bg-[#0a66c2]/[0.14]",
        layout === "stacked" ? "size-12 sm:size-[3.25rem]" : "size-12",
      )}
      aria-hidden
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-[#0a66c2] text-[0.68rem] font-bold leading-none text-white shadow-sm">
        in
      </span>
    </span>
  );

  return (
    <>
      <button
        type="button"
        onClick={handleCardClick}
        className={cn(
          cardClassName,
          "group border-slate-200/90 bg-white shadow-sm",
          "hover:border-[#0a66c2]/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 focus-visible:ring-offset-2",
          "motion-safe:active:scale-[0.99] motion-reduce:active:scale-100",
        )}
      >
        {badge}
        {layout === "stacked" ? (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Import LinkedIn profile
            </span>
            <span className="text-pretty text-xs font-medium leading-snug text-slate-500">
              Save your profile as a PDF from LinkedIn &mdash; we&apos;ll fill in your draft with AI
            </span>
          </span>
        ) : (
          <span className="min-w-0 flex-1">
            <span className="text-base font-semibold tracking-tight text-slate-950">
              Import LinkedIn profile
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-slate-600">
              Save your profile as a PDF from LinkedIn, then upload it here.
            </span>
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={!pending} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import from LinkedIn</DialogTitle>
            <DialogDescription>
              LinkedIn doesn&apos;t let other apps read your profile directly, so export it
              yourself &mdash; it takes about 20 seconds.
            </DialogDescription>
          </DialogHeader>

          <ol className="flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span
                  className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0a66c2]/10 text-xs font-semibold text-[#0a66c2] ring-1 ring-[#0a66c2]/15"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{step.title}</span>
                  <span className="mt-0.5 block text-pretty text-xs leading-relaxed text-muted-foreground">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <a
            href={PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-[#0a66c2] underline-offset-4 hover:underline"
          >
            Open my LinkedIn profile
            <ExternalLink className="size-3.5" aria-hidden />
          </a>

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            disabled={pending}
            className="sr-only"
            onChange={onPickerChange}
            aria-describedby={validationError ? "linkedin-import-err" : undefined}
          />

          {fileMeta ? (
            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-3">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-900/[0.06]"
                aria-hidden
              >
                <FileType2 className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground" title={fileMeta.name}>
                  {fileMeta.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {fileMeta.typeLabel} &middot; {fileMeta.size}
                </p>
              </div>
              {!pending ? (
                <button
                  type="button"
                  onClick={openPicker}
                  className="text-xs font-medium text-[#2268d7] underline-offset-2 hover:underline"
                  aria-label="Choose a different file"
                >
                  Change
                </button>
              ) : null}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={openPicker}
              disabled={pending}
              className="w-full"
            >
              Select LinkedIn PDF
            </Button>
          )}

          {validationError ? (
            <p
              id="linkedin-import-err"
              className="text-pretty text-xs font-medium text-red-600"
              role="alert"
            >
              {validationError}
            </p>
          ) : null}

          {importError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"
            >
              <X className="mt-px size-4 shrink-0" aria-hidden />
              <span className="text-pretty">{importError}</span>
            </div>
          ) : null}

          <DialogFooter className="-mx-4 -mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmImport}
              disabled={pending || !selected}
              aria-busy={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  Importing&hellip;
                </>
              ) : (
                "Import profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
