/** Matches `supabase/migrations/*_seed_resume_templates.sql` — default layout for new projects. */
export const TEMPLATE_IDS = {
  athena: "a0000001-0000-4000-8000-000000000001",
  meridian: "a0000001-0000-4000-8000-000000000002",
  nova: "a0000001-0000-4000-8000-000000000003",
} as const;

export const DEFAULT_TEMPLATE_ID = TEMPLATE_IDS.athena;

export type TemplateSlug = "athena" | "meridian" | "nova";

export function isTemplateSlug(s: string): s is TemplateSlug {
  return s === "athena" || s === "meridian" || s === "nova";
}
