import type { ResumePreviewPageBreakKey, ResumePreviewPageBreaks } from "@/lib/resume-preview/model";
import type { WizardStateV1 } from "@/lib/resume-wizard/types";

/**
 * Maps guest studio section toggles onto preview/PDF section keys.
 */
export function buildPageBreaksFromWizard(wizard: WizardStateV1): ResumePreviewPageBreaks | undefined {
  const src = wizard.layout?.pageBreakBefore;
  if (!src) return undefined;

  const out: ResumePreviewPageBreaks = {};
  const set = (k: ResumePreviewPageBreakKey) => {
    out[k] = true;
  };

  if (src.personal || src.summary) set("summary");
  if (src.experience) set("experience");
  if (src.education) set("education");
  if (src.skills) set("skills");
  if (src.certifications) set("certifications");
  if (src.projects) set("projects");
  if (src.languages || src.hobbies || src.courses || src.internships || src.additional) {
    set("additional");
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

/** Tailwind / print: following block starts on a new printed page. */
export const resumePageBreakBeforeClass =
  "break-before-page print:break-before-page [break-before:page]";
