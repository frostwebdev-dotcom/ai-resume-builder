import type { TemplateSlug } from "@/lib/resume-preview/template-ids";

/**
 * Single source of truth for each template's visual identity.
 * Both the React preview and the PDFKit renderer read from here so
 * on-screen and exported resumes match.
 *
 * All colors are print-safe: hex strings used by both Tailwind (via class
 * maps below) and PDFKit (directly). Keep the palette conservative —
 * ATS scanners ignore colors, but recruiters and hiring managers don't.
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
  headerStyle: "centered" | "split" | "compact";
  /** Section title treatment. */
  sectionTitleStyle: "underline" | "rule" | "accent-rule";
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
    twoColumnMeta: false,
    type: {
      name: 22,
      headline: 12,
      body: 10.5,
      small: 9,
      sectionTitle: 9,
    },
    rhythm: {
      sectionGap: 14,
      paragraphGap: 5,
      bulletIndent: 16,
      entryGap: 8,
    },
    pickerTagline: "Classic centered layout. Reliable for most roles and ATS parsers.",
  },
  meridian: {
    slug: "meridian",
    name: "Meridian",
    accent: "#1d4ed8",
    accentStrong: "#0b2a66",
    pageMarginPt: 48,
    headerStyle: "split",
    sectionTitleStyle: "accent-rule",
    twoColumnMeta: true,
    type: {
      name: 20,
      headline: 11,
      body: 10.5,
      small: 9,
      sectionTitle: 9,
    },
    rhythm: {
      sectionGap: 12,
      paragraphGap: 4,
      bulletIndent: 14,
      entryGap: 8,
    },
    pickerTagline:
      "Structured split header with a clear accent rhythm — confident and modern.",
  },
  nova: {
    slug: "nova",
    name: "Nova",
    accent: "#6b21a8",
    accentStrong: "#3b0f66",
    pageMarginPt: 40,
    headerStyle: "compact",
    sectionTitleStyle: "rule",
    twoColumnMeta: false,
    type: {
      name: 16,
      headline: 10,
      body: 9.25,
      small: 8,
      sectionTitle: 8,
    },
    rhythm: {
      sectionGap: 8,
      paragraphGap: 3,
      bulletIndent: 12,
      entryGap: 5,
    },
    pickerTagline:
      "Compact density for long histories. Best for senior or technical resumes.",
  },
};

export function getTemplateTheme(slug: TemplateSlug): TemplateTheme {
  return THEMES[slug] ?? THEMES.athena;
}

export const ALL_TEMPLATE_THEMES: TemplateTheme[] = [
  THEMES.athena,
  THEMES.meridian,
  THEMES.nova,
];
