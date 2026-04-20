import type { ResumeStyleV1 } from "@/lib/resume-preview/resume-style";
import { mergeTemplateWithStyle } from "@/lib/resume-preview/resume-style";
import {
  getTemplateTheme,
  type TemplateLayoutFamily,
} from "@/lib/resume-preview/template-theme";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";

/**
 * PDF-side layout for a given template slug. Derived from the shared
 * template theme so preview and export stay in visual lockstep.
 */
export type PdfFontSet = {
  regular: string;
  bold: string;
  italic: string;
};

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
  headerStyle: "centered" | "split" | "compact" | "banner";
  sectionTitleStyle: "underline" | "rule" | "accent-rule";
  accent: string;
  accentStrong: string;
  fonts: PdfFontSet;
  /** Body copy alignment (user override). */
  bodyAlign: "left" | "center" | "justify";
  /** Extra line gap derived from line-height multiplier. */
  bodyLineGap: number;
  /** Structural family — renderer uses this to pick the page composition. */
  layoutFamily: TemplateLayoutFamily;
  /** Final avatar inclusion (template support AND user opt-in). */
  showAvatar: boolean;
};

const SANS_FONTS: PdfFontSet = {
  regular: "Helvetica",
  bold: "Helvetica-Bold",
  italic: "Helvetica-Oblique",
};

const SERIF_FONTS: PdfFontSet = {
  regular: "Times-Roman",
  bold: "Times-Bold",
  italic: "Times-Italic",
};

export function getPdfLayout(slug: TemplateSlug, style?: ResumeStyleV1 | null): PdfLayout {
  const t = getTemplateTheme(slug);
  const m = mergeTemplateWithStyle(t, style ?? null);
  const bodyLineGap = Math.max(0, (m.lineHeight - 1) * m.type.body * 0.85);
  return {
    pageMargin: t.pageMarginPt,
    nameSize: t.type.name,
    headlineSize: t.type.headline,
    bodySize: t.type.body,
    smallSize: t.type.small,
    sectionTitleSize: t.type.sectionTitle,
    sectionGap: t.rhythm.sectionGap * m.sectionGapScale,
    paragraphGap: t.rhythm.paragraphGap * m.paragraphGapScale,
    bulletIndent: t.rhythm.bulletIndent,
    entryGap: t.rhythm.entryGap * m.paragraphGapScale,
    headerStyle: t.headerStyle,
    sectionTitleStyle: t.sectionTitleStyle,
    accent: m.accent,
    accentStrong: m.accentStrong,
    fonts: m.fontFamily === "serif" ? SERIF_FONTS : SANS_FONTS,
    bodyAlign: m.bodyTextAlign,
    bodyLineGap,
    layoutFamily: t.layoutFamily,
    showAvatar: m.showAvatar,
  };
}
