import {
  DEFAULT_TEMPLATE_SLUG,
  TEMPLATE_IDS,
  type TemplateSlug,
} from "@/lib/resume-preview/template-ids";

const ID_TO_SLUG: Record<string, TemplateSlug> = Object.fromEntries(
  Object.entries(TEMPLATE_IDS).map(([slug, id]) => [id, slug as TemplateSlug]),
);

export function templateIdToSlug(id: string | null | undefined): TemplateSlug {
  if (!id) return DEFAULT_TEMPLATE_SLUG;
  return ID_TO_SLUG[id] ?? DEFAULT_TEMPLATE_SLUG;
}
