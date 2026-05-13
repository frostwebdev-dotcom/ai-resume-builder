import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { DEFAULT_TEMPLATE_SLUG, TEMPLATE_SLUG_ORDER } from "@/lib/resume-preview/template-ids";
import { LAUNCH_TEMPLATE_METADATA } from "@/lib/resume-preview/template-metadata";

/**
 * Structural layout family. Launch catalog is **classic only** (single column,
 * no photo rail, no banner headshots) for ATS-safe preview/PDF parity.
 */
export type TemplateLayoutFamily = "classic" | "sidebar" | "photo-banner";

export type TemplateTheme = {
  slug: TemplateSlug;
  name: string;
  accent: string;
  accentStrong: string;
  pageMarginPt: number;
  headerStyle: "centered" | "split" | "compact" | "banner";
  sectionTitleStyle: "underline" | "rule" | "accent-rule";
  fontFamily: "sans" | "serif";
  /** Reserved for future variants; launch templates keep `false`. */
  twoColumnMeta: boolean;
  layoutFamily: TemplateLayoutFamily;
  type: {
    name: number;
    headline: number;
    body: number;
    small: number;
    sectionTitle: number;
  };
  rhythm: {
    sectionGap: number;
    paragraphGap: number;
    bulletIndent: number;
    entryGap: number;
  };
  pickerTagline: string;
  bestFor: string;
};

export function templateSupportsAvatar(theme: TemplateTheme): boolean {
  return theme.layoutFamily === "sidebar" || theme.layoutFamily === "photo-banner";
}

const LAUNCH_THEMES: Record<TemplateSlug, TemplateTheme> = {
  "professional-ats": {
    slug: "professional-ats",
    name: "Professional ATS",
    accent: "#1e3a8a",
    accentStrong: "#0f172a",
    pageMarginPt: 52,
    headerStyle: "compact",
    sectionTitleStyle: "underline",
    fontFamily: "sans",
    twoColumnMeta: false,
    layoutFamily: "classic",
    type: { name: 17, headline: 10.5, body: 10.5, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 14, paragraphGap: 5, bulletIndent: 15, entryGap: 8 },
    pickerTagline: LAUNCH_TEMPLATE_METADATA["professional-ats"].headline,
    bestFor:
      "Conservative employers, recruiting volume, and roles where predictable structure matters more than styling.",
  },
  "modern-professional": {
    slug: "modern-professional",
    name: "Modern Professional",
    accent: "#2268d7",
    accentStrong: "#0f172a",
    pageMarginPt: 50,
    headerStyle: "split",
    sectionTitleStyle: "accent-rule",
    fontFamily: "sans",
    twoColumnMeta: false,
    layoutFamily: "classic",
    type: { name: 18, headline: 11, body: 10.5, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 13, paragraphGap: 5, bulletIndent: 15, entryGap: 8 },
    pickerTagline: LAUNCH_TEMPLATE_METADATA["modern-professional"].headline,
    bestFor:
      "Business, marketing, product, operations, and general professional paths that still want a polished feel.",
  },
  "technical-clean": {
    slug: "technical-clean",
    name: "Technical Clean",
    accent: "#0f766e",
    accentStrong: "#134e4a",
    pageMarginPt: 48,
    headerStyle: "compact",
    sectionTitleStyle: "rule",
    fontFamily: "sans",
    twoColumnMeta: false,
    layoutFamily: "classic",
    type: { name: 17, headline: 10.5, body: 10.25, small: 8.75, sectionTitle: 8.75 },
    rhythm: { sectionGap: 12, paragraphGap: 4.5, bulletIndent: 14, entryGap: 7 },
    pickerTagline: LAUNCH_TEMPLATE_METADATA["technical-clean"].headline,
    bestFor:
      "Developers, data, platform, and project-heavy IC resumes that need density without decorative noise.",
  },
};

export function getTemplateTheme(slug: TemplateSlug): TemplateTheme {
  return LAUNCH_THEMES[slug] ?? LAUNCH_THEMES[DEFAULT_TEMPLATE_SLUG];
}

export const ALL_TEMPLATE_THEMES: TemplateTheme[] = TEMPLATE_SLUG_ORDER.map((s) => LAUNCH_THEMES[s]);
