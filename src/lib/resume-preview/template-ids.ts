/** Matches `supabase/migrations/*_seed_resume_templates.sql` — default layout for new projects. */
export const TEMPLATE_IDS = {
  athena: "a0000001-0000-4000-8000-000000000001",
  meridian: "a0000001-0000-4000-8000-000000000002",
  nova: "a0000001-0000-4000-8000-000000000003",
  helios: "a0000001-0000-4000-8000-000000000004",
  vanta: "a0000001-0000-4000-8000-000000000005",
  lumen: "a0000001-0000-4000-8000-000000000006",
  onyx: "a0000001-0000-4000-8000-000000000007",
  clio: "a0000001-0000-4000-8000-000000000008",
} as const;

export const DEFAULT_TEMPLATE_ID = TEMPLATE_IDS.athena;

export type TemplateSlug =
  | "athena"
  | "meridian"
  | "nova"
  | "helios"
  | "vanta"
  | "lumen"
  | "onyx"
  | "clio";

const ALL_SLUGS: readonly TemplateSlug[] = [
  "athena",
  "meridian",
  "nova",
  "helios",
  "vanta",
  "lumen",
  "onyx",
  "clio",
];

export function isTemplateSlug(s: string): s is TemplateSlug {
  return (ALL_SLUGS as readonly string[]).includes(s);
}
