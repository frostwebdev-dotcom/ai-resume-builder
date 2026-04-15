"use client";

import { useState, useTransition } from "react";
import { Briefcase, Loader2 } from "lucide-react";

import { saveJobTargetAction } from "@/services/job-target/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { JobTailorDisclaimer } from "@/components/resume-wizard/job-tailor-sections";

type JobTargetPanelProps = {
  projectId: string;
  initialTitle: string | null;
  initialCompany: string | null;
  initialJobDescription: string | null;
  /** Called after a successful save so the builder knows a job target is available for tailoring. */
  onSaved?: (payload: {
    title: string | null;
    company: string | null;
    jobDescription: string;
  }) => void;
  className?: string;
};

export function JobTargetPanel({
  projectId,
  initialTitle,
  initialCompany,
  initialJobDescription,
  onSaved,
  className,
}: JobTargetPanelProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [company, setCompany] = useState(initialCompany ?? "");
  const [jobDescription, setJobDescription] = useState(initialJobDescription ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setError(null);
    setMessage(null);
    start(() => {
      void (async () => {
        const res = await saveJobTargetAction({
          projectId,
          title: title.trim() || undefined,
          company: company.trim() || undefined,
          jobDescription,
        });
        if (res.ok) {
          setMessage("Job saved. You can tailor sections below.");
          onSaved?.({
            title: title.trim() || null,
            company: company.trim() || null,
            jobDescription: jobDescription.trim(),
          });
        } else {
          setError(res.error);
        }
      })();
    });
  };

  const hasText = jobDescription.trim().length > 0;

  return (
    <section
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/[0.03] p-4 ring-1 ring-primary/10 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Briefcase className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold text-foreground">Target job</h2>
          <p className="text-sm text-muted-foreground">
            Paste the job posting here once. We will use it to suggest wording that matches the role — you stay in control.
          </p>
        </div>
      </div>

      <JobTailorDisclaimer className="mt-4" />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id="jt-title" label="Job title (optional)" description="Helps the AI understand the role.">
          <Input
            id="jt-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior product designer"
            className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          />
        </Field>
        <Field id="jt-company" label="Company (optional)">
          <Input
            id="jt-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="min-h-11 text-base sm:min-h-10 sm:text-sm"
          />
        </Field>
      </div>

      <Field
        id="jt-jd"
        label="Job description"
        required
        description="Copy the full posting from the employer site."
        className="mt-4"
      >
        <Textarea
          id="jt-jd"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="min-h-[12rem] text-base sm:min-h-[10rem] sm:text-sm"
          placeholder="Paste responsibilities, requirements, and nice-to-haves here."
        />
      </Field>

      {error ? (
        <p className="mt-2 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-2 text-sm font-medium text-success" role="status">
          {message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          size="touch"
          className="w-full sm:w-auto"
          disabled={!hasText || pending}
          onClick={save}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          Save job target
        </Button>
        {!hasText ? (
          <span className="text-caption text-muted-foreground">Add text to enable saving.</span>
        ) : null}
      </div>
    </section>
  );
}
