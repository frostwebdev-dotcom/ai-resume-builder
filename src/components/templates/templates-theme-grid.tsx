import { TemplatesCatalog } from "@/components/templates/templates-catalog";

type Props = {
  /** Extra classes on the catalog root (layout, max-width, spacing). */
  className?: string;
};

/**
 * @deprecated Prefer importing {@link TemplatesCatalog} with `surface="marketing"`.
 * Marketing `/templates` — browse templates with search, filters, and preview.
 */
export function TemplatesThemeGrid({ className }: Props) {
  return <TemplatesCatalog surface="marketing" className={className} />;
}
