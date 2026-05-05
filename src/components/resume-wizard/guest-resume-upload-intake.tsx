"use client";

import { useCallback, useRef, useState, useTransition, type ChangeEvent } from "react";
import { FileUp, Loader2 } from "lucide-react";

import { importResumeFromFileAction } from "@/services/resume-import/actions";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { cn } from "@/lib/utils";

const MAX_BYTES = 9 * 1024 * 1024;

const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function mimeForUpload(file: File): "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | null {
  if (file.type === "application/pdf") return "application/pdf";
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
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

type Props = {
  templateSlug: TemplateSlug;
  onImported: (wizard: WizardStateV1) => void;
  cardClassName: string;
};

export function GuestResumeUploadIntake({ templateSlug, onImported, cardClassName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openPicker = useCallback(() => {
    setError(null);
    inputRef.current?.click();
  }, []);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const mime = mimeForUpload(file);
      if (!mime) {
        setError("Use a PDF or a Word .docx file.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Max file size is 9 MB.");
        return;
      }

      startTransition(() => {
        void (async () => {
          setError(null);
          try {
            const fileBase64 = await readFileAsBase64(file);
            const res = await importResumeFromFileAction({
              templateSlug,
              fileName: file.name,
              mimeType: mime,
              fileBase64,
            });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            onImported(res.wizard);
          } catch {
            setError("Something went wrong while importing. Please try again.");
          }
        })();
      });
    },
    [onImported, templateSlug],
  );

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={onChange} />
      <button
        type="button"
        disabled={pending}
        onClick={openPicker}
        className={cn(
          cardClassName,
          "group border-slate-200/90 bg-white shadow-sm",
          "hover:border-sky-300/80 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 focus-visible:ring-offset-2",
          "motion-safe:active:scale-[0.99] motion-reduce:active:scale-100",
          pending && "pointer-events-none opacity-80",
        )}
        aria-busy={pending}
        aria-describedby={error ? "guest-resume-upload-err" : undefined}
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
          <span className="text-sm font-semibold tracking-tight text-slate-900">Upload existing resume</span>
          <span className="text-pretty text-xs font-medium leading-snug text-slate-500">
            PDF or Word (.docx) — we extract text and structure it with AI
          </span>
        </span>
      </button>
      {error ? (
        <p id="guest-resume-upload-err" className="text-pretty text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
