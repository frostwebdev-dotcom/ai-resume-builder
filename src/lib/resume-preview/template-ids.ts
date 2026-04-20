/** Canonical order: UUID suffix `00…001` … `00…028` (hex) = templates 1–40. */
export const TEMPLATE_SLUG_ORDER = [
  "athena",
  "meridian",
  "nova",
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

function templateUuid(oneBasedIndex: number): string {
  const hex = oneBasedIndex.toString(16).padStart(12, "0");
  return `a0000001-0000-4000-8000-${hex}`;
}

export const TEMPLATE_IDS = Object.fromEntries(
  TEMPLATE_SLUG_ORDER.map((slug, i) => [slug, templateUuid(i + 1)]),
) as Record<TemplateSlug, string>;

export const DEFAULT_TEMPLATE_ID = TEMPLATE_IDS.athena;

const SLUG_SET = new Set<string>(TEMPLATE_SLUG_ORDER);

export function isTemplateSlug(s: string): s is TemplateSlug {
  return SLUG_SET.has(s);
}
