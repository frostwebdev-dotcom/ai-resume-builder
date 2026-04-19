import type { TemplateSlug } from "@/lib/resume-preview/template-ids";

/**
 * Single source of truth for each template's visual identity.
 * Both the React preview and the PDFKit renderer read from here so
 * on-screen and exported resumes match.
 *
 * All colors are print-safe: hex strings used by both Tailwind (via class
 * maps below) and PDFKit (directly). Keep the palette conservative —
 * ATS scanners ignore colors, but recruiters and hiring managers don't.
 *
 * To add a new template:
 *   1. Add a slug in `template-ids.ts` and seed a row in Supabase.
 *   2. Add a theme row in `THEMES` below. Nothing else needs editing —
 *      the unified `ThemedTemplate` preview and the PDFKit renderer both
 *      consume this object.
 */
export type TemplateTheme = {
  slug: TemplateSlug;
  /** Short label for internal logs / debugging. */
  name: string;
  /** Accent color (hex) applied to subtle rules and section titles. */
  accent: string;
  /** Darker accent used for strong text elements (name). */
  accentStrong: string;
  /** Page margin in PDF points (72pt = 1in). */
  pageMarginPt: number;
  /** Header composition pattern. */
  headerStyle: "centered" | "split" | "compact" | "banner";
  /** Section title treatment. */
  sectionTitleStyle: "underline" | "rule" | "accent-rule";
  /** Typeface family used for both preview and PDF. */
  fontFamily: "sans" | "serif";
  /** Whether the Skills + Certifications blocks may render side-by-side on preview. */
  twoColumnMeta: boolean;
  /** Typography scale used by both renderers. */
  type: {
    name: number;
    headline: number;
    body: number;
    small: number;
    sectionTitle: number;
  };
  /** Vertical rhythm in PDF points. */
  rhythm: {
    sectionGap: number;
    paragraphGap: number;
    bulletIndent: number;
    entryGap: number;
  };
  /** Short copy shown on the template picker card. */
  pickerTagline: string;
  /** One-line audience hint shown below the tagline on the picker. */
  bestFor: string;
};

const THEMES: Record<TemplateSlug, TemplateTheme> = {
  athena: {
    slug: "athena",
    name: "Athena",
    accent: "#2a6f6f",
    accentStrong: "#0f3535",
    pageMarginPt: 50,
    headerStyle: "centered",
    sectionTitleStyle: "underline",
    fontFamily: "sans",
    twoColumnMeta: false,
    type: { name: 22, headline: 12, body: 10.5, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 14, paragraphGap: 5, bulletIndent: 16, entryGap: 8 },
    pickerTagline: "Classic centered layout with confident hierarchy.",
    bestFor: "Reliable choice for most roles and ATS parsers.",
  },
  meridian: {
    slug: "meridian",
    name: "Meridian",
    accent: "#1d4ed8",
    accentStrong: "#0b2a66",
    pageMarginPt: 48,
    headerStyle: "split",
    sectionTitleStyle: "accent-rule",
    fontFamily: "sans",
    twoColumnMeta: true,
    type: { name: 20, headline: 11, body: 10.5, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 12, paragraphGap: 4, bulletIndent: 14, entryGap: 8 },
    pickerTagline: "Structured split header with clear accent rhythm.",
    bestFor: "Senior, modern roles that value clarity.",
  },
  nova: {
    slug: "nova",
    name: "Nova",
    accent: "#6b21a8",
    accentStrong: "#3b0f66",
    pageMarginPt: 40,
    headerStyle: "compact",
    sectionTitleStyle: "rule",
    fontFamily: "sans",
    twoColumnMeta: false,
    type: { name: 16, headline: 10, body: 9.25, small: 8, sectionTitle: 8 },
    rhythm: { sectionGap: 8, paragraphGap: 3, bulletIndent: 12, entryGap: 5 },
    pickerTagline: "Compact density for long, detailed histories.",
    bestFor: "Senior engineering or deep technical resumes.",
  },
  helios: {
    slug: "helios",
    name: "Helios",
    accent: "#b45309",
    accentStrong: "#78350f",
    pageMarginPt: 52,
    headerStyle: "centered",
    sectionTitleStyle: "accent-rule",
    fontFamily: "serif",
    twoColumnMeta: false,
    type: { name: 22, headline: 12, body: 10.75, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 14, paragraphGap: 5, bulletIndent: 16, entryGap: 8 },
    pickerTagline: "Warm amber serif, executive presence.",
    bestFor: "Business, finance, client-facing leadership.",
  },
  vanta: {
    slug: "vanta",
    name: "Vanta",
    accent: "#374151",
    accentStrong: "#0f172a",
    pageMarginPt: 46,
    headerStyle: "compact",
    sectionTitleStyle: "underline",
    fontFamily: "sans",
    twoColumnMeta: false,
    type: { name: 18, headline: 11, body: 10.5, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 12, paragraphGap: 4, bulletIndent: 14, entryGap: 7 },
    pickerTagline: "Monochrome minimal — absolutely no noise.",
    bestFor: "Strict ATS pipelines or conservative industries.",
  },
  lumen: {
    slug: "lumen",
    name: "Lumen",
    accent: "#047857",
    accentStrong: "#064e3b",
    pageMarginPt: 50,
    headerStyle: "split",
    sectionTitleStyle: "accent-rule",
    fontFamily: "sans",
    twoColumnMeta: true,
    type: { name: 20, headline: 11.5, body: 10.5, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 13, paragraphGap: 5, bulletIndent: 14, entryGap: 8 },
    pickerTagline: "Airy, modern, emerald accents.",
    bestFor: "Product, design, and growth-oriented tech roles.",
  },
  onyx: {
    slug: "onyx",
    name: "Onyx",
    accent: "#334155",
    accentStrong: "#0f172a",
    pageMarginPt: 48,
    headerStyle: "banner",
    sectionTitleStyle: "accent-rule",
    fontFamily: "sans",
    twoColumnMeta: false,
    type: { name: 22, headline: 11.5, body: 10.5, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 13, paragraphGap: 5, bulletIndent: 15, entryGap: 8 },
    pickerTagline: "Bold navy banner — authoritative leadership tone.",
    bestFor: "Directors, founders, and senior leadership.",
  },
  clio: {
    slug: "clio",
    name: "Clio",
    accent: "#9f1239",
    accentStrong: "#4c0519",
    pageMarginPt: 54,
    headerStyle: "centered",
    sectionTitleStyle: "underline",
    fontFamily: "serif",
    twoColumnMeta: false,
    type: { name: 21, headline: 12, body: 10.75, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 14, paragraphGap: 5, bulletIndent: 16, entryGap: 8 },
    pickerTagline: "Traditional serif with burgundy restraint.",
    bestFor: "Academic, legal, medical, and formal sectors.",
  },
};

export function getTemplateTheme(slug: TemplateSlug): TemplateTheme {
  return THEMES[slug] ?? THEMES.athena;
}

export const ALL_TEMPLATE_THEMES: TemplateTheme[] = [
  THEMES.athena,
  THEMES.meridian,
  THEMES.nova,
  THEMES.helios,
  THEMES.vanta,
  THEMES.lumen,
  THEMES.onyx,
  THEMES.clio,
];
