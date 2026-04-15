import type { TemplateSlug } from "@/lib/resume-preview/template-ids";

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
  /** Meridian: split header */
  headerStyle: "centered" | "split" | "compact";
};

const LAYOUTS: Record<TemplateSlug, PdfLayout> = {
  athena: {
    pageMargin: 50,
    nameSize: 22,
    headlineSize: 12,
    bodySize: 11,
    smallSize: 9,
    sectionTitleSize: 9,
    sectionGap: 14,
    paragraphGap: 5,
    bulletIndent: 18,
    headerStyle: "centered",
  },
  meridian: {
    pageMargin: 48,
    nameSize: 20,
    headlineSize: 11,
    bodySize: 11,
    smallSize: 9,
    sectionTitleSize: 9,
    sectionGap: 12,
    paragraphGap: 4,
    bulletIndent: 16,
    headerStyle: "split",
  },
  nova: {
    pageMargin: 40,
    nameSize: 16,
    headlineSize: 10,
    bodySize: 9,
    smallSize: 8,
    sectionTitleSize: 8,
    sectionGap: 8,
    paragraphGap: 3,
    bulletIndent: 14,
    headerStyle: "compact",
  },
};

export function getPdfLayout(slug: TemplateSlug): PdfLayout {
  return LAYOUTS[slug] ?? LAYOUTS.athena;
}
