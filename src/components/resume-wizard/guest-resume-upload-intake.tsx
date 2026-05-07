"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { FileText, FileType2, FileUp, Loader2, X } from "lucide-react";

import { importResumeFromFileAction } from "@/services/resume-import/actions";
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

const MAX_BYTES = 9 * 1024 * 1024;

type AcceptedMime =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function mimeForUpload(file: File): AcceptedMime | null {
  if (file.type === "application/pdf") return "application/pdf";
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string") {
        reject(new Error("read"));
        return;
      }
      const i = r.indexOf(",");
      resolve(i >= 0 ? r.slice(i + 1) : r);
    };
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : mb >= 10 ? 1 : 2)} MB`;
}

function labelForMime(mime: AcceptedMime): string {
  return mime === "application/pdf" ? "PDF document" : "Word document (.docx)";
}

type Props = {
  templateSlug: TemplateSlug;
  onImported: (wizard: WizardStateV1) => void;
  cardClassName: string;
};

type Selected = { file: File; mime: AcceptedMime };

export function GuestResumeUploadIntake({
  templateSlug,
  onImported,
  cardClassName,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<Selected | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resetInput = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const onPickerChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        resetInput();
        return;
      }

      const mime = mimeForUpload(file);
      if (!mime) {
        setValidationError("Use a PDF or a Word (.docx) file.");
        setSelected(null);
        resetInput();
        return;
      }
      if (file.size > MAX_BYTES) {
        setValidationError("Max file size is 9 MB.");
        setSelected(null);
        resetInput();
        return;
      }

      setValidationError(null);
      setImportError(null);
      setSelected({ file, mime });
    },
    [resetInput],
  );

  const closeModal = useCallback(() => {
    if (pending) return;
    setSelected(null);
    setImportError(null);
    resetInput();
  }, [pending, resetInput]);

  const onModalOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeModal();
    },
    [closeModal],
  );

  const confirmImport = useCallback(() => {
    if (!selected || pending) return;
    const { file, mime } = selected;

    setImportError(null);
    startTransition(() => {
      void (async () => {
        try {
          const fileBase64 = await readFileAsBase64(file);
          const res = await importResumeFromFileAction({
            templateSlug,
            fileName: file.name,
            mimeType: mime,
            fileBase64,
          });
          if (!res.ok) {
            setImportError(res.error);
            return;
          }
          onImported(res.wizard);
          setSelected(null);
          resetInput();
        } catch {
          setImportError("Something went wrong while importing. Please try again.");
        }
      })();
    });
  }, [onImported, pending, resetInput, selected, templateSlug]);

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

  const fileMeta = useMemo(() => {
    if (!selected) return null;
    return {
      name: selected.file.name,
      size: formatFileSize(selected.file.size),
      typeLabel: labelForMime(selected.mime),
      isPdf: selected.mime === "application/pdf",
    };
  }, [selected]);

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
        accept={ACCEPT}
        disabled={pending}
        className="sr-only"
        onChange={onPickerChange}
        aria-describedby={validationError ? "guest-resume-upload-err" : undefined}
      />
      <label
        htmlFor={inputId}
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
            PDF or Word (.docx) — we extract text and structure it with AI
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
                  {fileMeta.typeLabel} · {fileMeta.size}
                </p>
              </div>
              {!pending ? (
                <button
                  type="button"
                  onClick={() => {
                    inputRef.current?.click();
                  }}
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
                  Importing…
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
