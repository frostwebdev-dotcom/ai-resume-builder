import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";

/**
 * PDF-side layout for a given template slug. Derived from the shared
 * template theme so preview and export stay in visual lockstep.
 */
export type PdfLayout = {
  pageMargin: number;
  nameSize: number;
  headlineSize: number;
  bodySize: number;
  smallSize: number;
  sectionTitleSize: number;
  sectionGap: number;
  paragraphGap: number;
  bulletIndent: number;
  entryGap: number;
  headerStyle: "centered" | "split" | "compact";
  sectionTitleStyle: "underline" | "rule" | "accent-rule";
  accent: string;
  accentStrong: string;
};

export function getPdfLayout(slug: TemplateSlug): PdfLayout {
  const t = getTemplateTheme(slug);
  return {
    pageMargin: t.pageMarginPt,
    nameSize: t.type.name,
    headlineSize: t.type.headline,
    bodySize: t.type.body,
    smallSize: t.type.small,
    sectionTitleSize: t.type.sectionTitle,
    sectionGap: t.rhythm.sectionGap,
    paragraphGap: t.rhythm.paragraphGap,
    bulletIndent: t.rhythm.bulletIndent,
    entryGap: t.rhythm.entryGap,
    headerStyle: t.headerStyle,
    sectionTitleStyle: t.sectionTitleStyle,
    accent: t.accent,
    accentStrong: t.accentStrong,
  };
}
