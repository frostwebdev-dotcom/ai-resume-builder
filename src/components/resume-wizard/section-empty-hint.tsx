"use client";

import type { ReactNode } from "react";

import type { WizardStateV1 } from "@/lib/resume-wizard/types";
import { cn } from "@/lib/utils";

type Tone = "default" | "guest";

type SectionEmptyHintProps = {
  purpose: string;
  /** Primary action (e.g. insert example) or example line as node */
  primary?: ReactNode;
  secondaryHint?: string;
  className?: string;
  tone?: Tone;
};

/**
 * Compact empty-state helper: one purpose line, optional primary slot, optional hint.
 */
export function SectionEmptyHint({
  purpose,
  primary,
  secondaryHint,
  className,
  tone = "default",
}: SectionEmptyHintProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed px-3 py-2.5",
        tone === "guest"
          ? "border-neutral-200/90 bg-neutral-50/90"
          : "border-border/80 bg-muted/25",
        className,
      )}
      role="region"
      aria-label="Getting started"
    >
      <p
        className={cn(
          "text-sm leading-snug",
          tone === "guest" ? "text-neutral-800" : "text-foreground/90",
        )}
      >
        {purpose}
      </p>
      {primary ? <div className="mt-2 flex flex-wrap gap-2">{primary}</div> : null}
      {secondaryHint ? (
        <p
          className={cn(
            "mt-2 text-xs leading-relaxed",
            tone === "guest" ? "text-neutral-600" : "text-muted-foreground",
          )}
        >
          {secondaryHint}
        </p>
      ) : null}
    </div>
  );
}

function singleBlankExperienceEntry(entries: WizardStateV1["experience"]["entries"]): boolean {
  if (entries.length !== 1) return false;
  const e = entries[0];
  return (
    !e.title.trim() &&
    !e.company.trim() &&
    !e.location.trim() &&
    !e.startDate.trim() &&
    !e.endDate.trim() &&
    !e.current &&
    e.highlights.every((h) => !h.trim())
  );
}

function singleBlankEducationEntry(entries: WizardStateV1["education"]["entries"]): boolean {
  if (entries.length !== 1) return false;
  const e = entries[0];
  return (
    !e.school.trim() &&
    !e.degree.trim() &&
    !e.field.trim() &&
    !e.startDate.trim() &&
    !e.endDate.trim() &&
    !e.current &&
    !e.details.trim()
  );
}

function singleBlankProjectEntry(entries: WizardStateV1["projects"]["entries"]): boolean {
  if (entries.length !== 1) return false;
  const e = entries[0];
  return !e.name.trim() && !e.url.trim() && !e.description.trim() && !e.technologies.trim();
}

function singleBlankCertEntry(entries: WizardStateV1["certifications"]["entries"]): boolean {
  if (entries.length !== 1) return false;
  const e = entries[0];
  return !e.name.trim() && !e.issuer.trim() && !e.issued.trim() && !e.expires.trim();
}

export function showExperienceEmptyHint(state: WizardStateV1): boolean {
  return singleBlankExperienceEntry(state.experience.entries);
}

export function showEducationEmptyHint(state: WizardStateV1): boolean {
  return singleBlankEducationEntry(state.education.entries);
}

export function showProjectsEmptyHint(state: WizardStateV1): boolean {
  return singleBlankProjectEntry(state.projects.entries);
}

export function showCertificationsEmptyHint(state: WizardStateV1): boolean {
  return singleBlankCertEntry(state.certifications.entries);
}
