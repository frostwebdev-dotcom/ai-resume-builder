import { TemplatesCatalog } from "@/components/templates/templates-catalog";

type Props = {
  guest: boolean;
  className?: string;
};

/**
 * @deprecated Prefer importing {@link TemplatesCatalog} with `surface="app"`.
 * In-app template picker with search and filters.
 */
export function SelectableTemplatesThemeGrid({ guest, className }: Props) {
  return <TemplatesCatalog surface="app" guest={guest} className={className} />;
}
