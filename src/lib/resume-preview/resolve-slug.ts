import { TEMPLATE_IDS, type TemplateSlug } from "@/lib/resume-preview/template-ids";

export function templateIdToSlug(id: string | null | undefined): TemplateSlug {
  if (id === TEMPLATE_IDS.meridian) return "meridian";
  if (id === TEMPLATE_IDS.nova) return "nova";
  return "athena";
}
