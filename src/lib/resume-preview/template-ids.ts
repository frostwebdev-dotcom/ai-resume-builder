/**
 * Resume layout templates — UUID suffix `…000001` through `…000028` (hex) matches
 * `public.templates` seeds (`supabase/migrations/*seed*templates*.sql`) — 40 templates total.
 */
export const TEMPLATE_SLUG_ORDER = [
  "professional-ats",
  "modern-professional",
  "technical-clean",
  "helios",
  "vanta",
  "lumen",
  "onyx",
  "clio",
  "astra",
  "borealis",
  "cypress",
  "denali",
  "ember",
  "fjord",
  "granite",
  "harbor",
  "iris",
  "jade",
  "kelvin",
  "luna",
  "matrix",
  "nimbus",
  "orion",
  "pacific",
  "quartz",
  "ridge",
  "slate",
  "titan",
  "umber",
  "vertex",
  "willow",
  "xenon",
  "yield",
  "zephyr",
  "apex",
  "bridge",
  "cipher",
  "drift",
  "echo",
  "forge",
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

/** Human-readable name for UI (picker, catalog, PDF). */
export function templatePublicDisplayName(slug: TemplateSlug): string {
  if (slug === "professional-ats") return "Professional ATS";
  if (slug === "modern-professional") return "Modern Professional";
  if (slug === "technical-clean") return "Technical Clean";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
