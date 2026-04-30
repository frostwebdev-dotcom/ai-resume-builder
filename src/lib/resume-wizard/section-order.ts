import type { WizardEditorSectionId } from "@/lib/resume-wizard/types";

/** Default studio nav order (must include every section id exactly once). */
export const DEFAULT_GUEST_STUDIO_SECTION_ORDER: readonly WizardEditorSectionId[] = [
  "personal",
  "summary",
  "education",
  "experience",
  "skills",
  "languages",
  "hobbies",
  "courses",
  "internships",
  "certifications",
  "projects",
  "additional",
] as const;

const ALL_IDS = new Set<string>(DEFAULT_GUEST_STUDIO_SECTION_ORDER);

function isSectionId(x: string): x is WizardEditorSectionId {
  return ALL_IDS.has(x);
}

/**
 * Ensures a full permutation: keeps valid ids from `raw` in order, then appends any missing defaults.
 */
export function normalizeWizardSectionOrder(raw: unknown): WizardEditorSectionId[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_GUEST_STUDIO_SECTION_ORDER];
  }
  const seen = new Set<string>();
  const out: WizardEditorSectionId[] = [];
  for (const item of raw) {
    if (typeof item !== "string" || !isSectionId(item) || seen.has(item)) continue;
    out.push(item);
    seen.add(item);
  }
  for (const id of DEFAULT_GUEST_STUDIO_SECTION_ORDER) {
    if (!seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  return out;
}
