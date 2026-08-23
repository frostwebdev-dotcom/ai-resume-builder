"use client";

import { useCallback, useEffect } from "react";
import { FileText, FileType2, FileUp, Loader2, X } from "lucide-react";

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

type Props = {
  templateSlug: TemplateSlug;
  onImported: (wizard: WizardStateV1) => void;
  cardClassName: string;
  onPickerOpen?: () => void;
};

export function GuestResumeUploadIntake({
  templateSlug,
  onImported,
  cardClassName,
  onPickerOpen,
}: Props) {
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
  } = useResumeFileImport({ templateSlug, onImported });

  const closeModal = useCallback(() => {
    if (pending) return;
    clearSelection();
  }, [clearSelection, pending]);

  const onModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeModal();
    },
    [closeModal],
  );

  // Allow Enter to confirm while modal is open and not pending.
  useEffect(() => {
    if (!selected || pending) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmImport();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmImport, pending, selected]);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {/*
        Single click pattern: input lives outside the label and `htmlFor` points to it.
        The browser opens the OS file picker exactly once per label click.
      */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={pending}
        className="sr-only"
        onChange={onPickerChange}
        aria-describedby={validationError ? "guest-resume-upload-err" : undefined}
      />
      <label
        htmlFor={inputId}
        onClick={onPickerOpen}
        className={cn(
          cardClassName,
          "group cursor-pointer border-slate-200/90 bg-white shadow-sm",
          "hover:border-sky-300/80 hover:shadow-md",
          "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-[#2268d7]/35 has-[input:focus-visible]:ring-offset-2",
          "motion-safe:active:scale-[0.99] motion-reduce:active:scale-100",
          pending && "pointer-events-none cursor-wait opacity-80",
        )}
        aria-busy={pending}
        aria-disabled={pending}
      >
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-900/[0.05] transition-colors sm:size-[3.25rem] group-hover:bg-sky-100/90"
          aria-hidden
        >
          {pending ? (
            <Loader2 className="size-6 animate-spin sm:size-[1.65rem]" strokeWidth={1.75} />
          ) : (
            <FileUp className="size-6 sm:size-[1.65rem]" strokeWidth={1.75} />
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            Upload existing resume
          </span>
          <span className="text-pretty text-xs font-medium leading-snug text-slate-500">
            Upload a PDF or Word document and organize your content with AI.
          </span>
        </span>
      </label>
      {validationError ? (
        <p
          id="guest-resume-upload-err"
          className="text-pretty text-xs font-medium text-red-600"
          role="alert"
        >
          {validationError}
        </p>
      ) : null}

      <Dialog open={Boolean(selected)} onOpenChange={onModalOpenChange}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import this resume?</DialogTitle>
            <DialogDescription>
              We&apos;ll read the text and use AI to fill in your draft. The original file is not stored.
            </DialogDescription>
          </DialogHeader>

          {fileMeta ? (
            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-3">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-lg ring-1",
                  fileMeta.isPdf
                    ? "bg-red-50 text-red-600 ring-red-900/[0.06]"
                    : "bg-blue-50 text-blue-600 ring-blue-900/[0.06]",
                )}
                aria-hidden
              >
                {fileMeta.isPdf ? (
                  <FileType2 className="size-5" strokeWidth={1.75} />
                ) : (
                  <FileText className="size-5" strokeWidth={1.75} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-foreground"
                  title={fileMeta.name}
                >
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
              onClick={closeModal}
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
                "Import résumé"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
