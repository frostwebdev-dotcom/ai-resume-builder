/**
 * Launch catalog: three curated, single-column templates (preview + PDF share tokens).
 * UUID suffix `00…001` … `00…003` = stable `template_id` in `resume_projects`.
 */
export const TEMPLATE_SLUG_ORDER = [
  "professional-ats",
  "modern-professional",
  "technical-clean",
] as const;

export type TemplateSlug = (typeof TEMPLATE_SLUG_ORDER)[number];

/** Default studio + new-project template. */
export const DEFAULT_TEMPLATE_SLUG: TemplateSlug = "professional-ats";

function templateUuid(oneBasedIndex: number): string {
  const hex = oneBasedIndex.toString(16).padStart(12, "0");
  return `a0000001-0000-4000-8000-${hex}`;
}

export const TEMPLATE_IDS = Object.fromEntries(
  TEMPLATE_SLUG_ORDER.map((slug, i) => [slug, templateUuid(i + 1)]),
) as Record<TemplateSlug, string>;

export const DEFAULT_TEMPLATE_ID = TEMPLATE_IDS[DEFAULT_TEMPLATE_SLUG];

const SLUG_SET = new Set<string>(TEMPLATE_SLUG_ORDER);

export function isTemplateSlug(s: string): s is TemplateSlug {
  return SLUG_SET.has(s);
}
