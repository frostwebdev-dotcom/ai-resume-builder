"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";

import { importResumeFromFileAction } from "@/services/resume-import/actions";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

export const RESUME_IMPORT_MAX_BYTES = 9 * 1024 * 1024;

export type AcceptedMime =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** File picker `accept` for flows that take either a PDF or a Word export. */
export const RESUME_IMPORT_ACCEPT = `.pdf,.docx,application/pdf,${DOCX_MIME}`;
/** LinkedIn's "Save to PDF" profile export is always a PDF. */
export const PDF_ONLY_ACCEPT = ".pdf,application/pdf";

export type Selected = { file: File; mime: AcceptedMime };

function mimeForUpload(file: File): AcceptedMime | null {
  if (file.type === "application/pdf") return "application/pdf";
  if (file.type === DOCX_MIME) return DOCX_MIME;
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".docx")) return DOCX_MIME;
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

export function formatFileSize(bytes: number): string {
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

type Options = {
  templateSlug: TemplateSlug;
  onImported: (wizard: WizardStateV1) => void;
  /** Restrict picks to PDF (LinkedIn profile exports are always PDF). */
  pdfOnly?: boolean;
};

/**
 * Shared client plumbing for "turn a document into a wizard draft": validate the pick,
 * base64 it, call the server import action, surface errors. Used by both the generic
 * résumé upload card and the LinkedIn profile-export card so they stay behaviourally
 * identical and only differ in copy.
 */
export function useResumeFileImport({ templateSlug, onImported, pdfOnly = false }: Options) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<Selected | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resetInput = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onPickerChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        resetInput();
        return;
      }

      const mime = mimeForUpload(file);
      if (!mime || (pdfOnly && mime !== "application/pdf")) {
        setValidationError(
          pdfOnly ? "Use the PDF file LinkedIn gave you." : "Use a PDF or a Word (.docx) file.",
        );
        setSelected(null);
        resetInput();
        return;
      }
      if (file.size > RESUME_IMPORT_MAX_BYTES) {
        setValidationError("Max file size is 9 MB.");
        setSelected(null);
        resetInput();
        return;
      }

      setValidationError(null);
      setImportError(null);
      setSelected({ file, mime });
    },
    [pdfOnly, resetInput],
  );

  const clearSelection = useCallback(() => {
    setSelected(null);
    setImportError(null);
    resetInput();
  }, [resetInput]);

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

  const fileMeta = useMemo(() => {
    if (!selected) return null;
    return {
      name: selected.file.name,
      size: formatFileSize(selected.file.size),
      typeLabel: labelForMime(selected.mime),
      isPdf: selected.mime === "application/pdf",
    };
  }, [selected]);

  return {
    inputId,
    inputRef,
    accept: pdfOnly ? PDF_ONLY_ACCEPT : RESUME_IMPORT_ACCEPT,
    selected,
    fileMeta,
    validationError,
    importError,
    pending,
    onPickerChange,
    openPicker,
    clearSelection,
    confirmImport,
    resetInput,
    setImportError,
  };
}
