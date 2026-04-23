"use client";

import type { ReactNode } from "react";
import { Loader2, Plus } from "lucide-react";
import { useFormStatus } from "react-dom";

import { createProjectFormAction } from "@/services/projects/actions";
import { cn } from "@/lib/utils";

type NewResumeSubmitButtonProps = {
  className: string;
  /** Shown when not submitting (string or small JSX). */
  idleContent: ReactNode;
  pendingText?: string;
  "aria-label"?: string;
};

function NewResumeSubmitButton({
  className,
  idleContent,
  pendingText = "Creating…",
  "aria-label": ariaLabel,
}: NewResumeSubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-label={
        ariaLabel ?? (pending ? "Creating new resume" : "Create a new saved resume and open the studio")
      }
      className={className}
    >
      {pending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Plus className="size-4 shrink-0" aria-hidden />
      )}
      {pending ? pendingText : idleContent}
    </button>
  );
}

export type NewResumeServerFormProps = {
  formClassName?: string;
  buttonClassName: string;
  idleContent: ReactNode;
  pendingText?: string;
  "aria-label"?: string;
};

/**
 * Creates a saved `resume_projects` row and redirects to the studio — same as
 * Resumes “Create new resume” and the signed-in sidebar “New” control.
 */
export function NewResumeServerForm({
  formClassName,
  buttonClassName,
  idleContent,
  pendingText,
  "aria-label": ariaLabel,
}: NewResumeServerFormProps) {
  return (
    <form action={createProjectFormAction} className={cn("w-full", formClassName)}>
      <input type="hidden" name="title" value="Untitled resume" />
      <NewResumeSubmitButton
        className={buttonClassName}
        idleContent={idleContent}
        pendingText={pendingText}
        aria-label={ariaLabel}
      />
    </form>
  );
}
