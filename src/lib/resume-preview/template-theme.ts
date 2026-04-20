import { hslToHex } from "@/lib/color/hsl-to-hex";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { TEMPLATE_SLUG_ORDER } from "@/lib/resume-preview/template-ids";

/**
 * Single source of truth for each template's visual identity.
 * Both the React preview and the PDFKit renderer read from here.
 */
/**
 * Structural layout family. Classic = single-column ATS-linear (default).
 * Sidebar = left rail (avatar/contact/skills) + right main column.
 * Photo-banner = full-width accent banner that can embed a circular avatar.
 *
 * `classic` templates NEVER render photos — keeping the default path ATS-safe
 * for US/UK markets regardless of user toggles.
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
  twoColumnMeta: boolean;
  /** Structural layout family (default "classic"). */
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

/**
 * Whether a template layout has a natural place for an avatar / photo.
 * Driven by layout family — classic single-column templates never do.
 */
export function templateSupportsAvatar(theme: TemplateTheme): boolean {
  return theme.layoutFamily === "sidebar" || theme.layoutFamily === "photo-banner";
}

/**
 * Hand-mapped slugs that belong to non-classic layout families.
 * Stable across deploys, independent of per-slug HSL generation.
 */
const SIDEBAR_SLUGS = new Set<TemplateSlug>([
  "astra",
  "denali",
  "iris",
  "matrix",
  "pacific",
  "quartz",
  "titan",
  "willow",
]);

const PHOTO_BANNER_SLUGS = new Set<TemplateSlug>([
  "borealis",
  "ember",
  "nimbus",
  "vertex",
]);

function layoutFamilyFor(slug: TemplateSlug): TemplateLayoutFamily {
  if (SIDEBAR_SLUGS.has(slug)) return "sidebar";
  if (PHOTO_BANNER_SLUGS.has(slug)) return "photo-banner";
  return "classic";
}

const HEADER_STYLES = ["centered", "split", "compact", "banner"] as const;
const SECTION_STYLES = ["underline", "rule", "accent-rule"] as const;

const TAGLINES: string[] = [
  "Classic centered layout with confident hierarchy.",
  "Structured split header with clear accent rhythm.",
  "Compact density for long, detailed histories.",
  "Warm serif tone with executive presence.",
  "Monochrome minimal — absolutely no noise.",
  "Airy split layout with emerald discipline.",
  "Bold banner header — authoritative leadership tone.",
  "Traditional serif with formal restraint.",
  "Modern sans with crisp section anchors.",
  "Executive split — contact column reads fast.",
  "Dense compact grid for technical depth.",
  "Centered classical serif for gravitas.",
  "Minimal gray scale for conservative sectors.",
  "Product-led clarity with accent markers.",
  "Statement banner for founder-level profiles.",
  "Serif elegance with burgundy restraint.",
  "Blue-chip structure for finance & ops.",
  "Two-column meta for skills-heavy roles.",
  "Tight rhythm for consulting timelines.",
  "Centered polish for client-facing leads.",
  "Compact mono-line density for IC seniors.",
  "Split header + accent rules for PMs.",
  "Serif + underline for academic paths.",
  "Neutral slate for enterprise ATS.",
  "Emerald growth tone for startups.",
  "Navy authority for legal & compliance.",
  "Warm serif for healthcare leadership.",
  "High-contrast sans for sales impact.",
  "Airy margins for design portfolios.",
  "Banner emphasis for public speakers.",
  "Traditional serif for policy & research.",
  "Minimal Vanta-like for government pipelines.",
  "Structured split for program managers.",
  "Compact for staff engineers.",
  "Centered for marketing generalists.",
  "Two-column for heavy certifications.",
  "Serif + rule for education leaders.",
  "Bold sans for product directors.",
  "Split + skills rail for support leaders.",
  "Banner + serif blend for executives.",
];

const BEST_FOR: string[] = [
  "Reliable choice for most roles and ATS parsers.",
  "Senior, modern roles that value clarity.",
  "Senior engineering or deep technical resumes.",
  "Business, finance, client-facing leadership.",
  "Strict ATS pipelines or conservative industries.",
  "Product, design, and growth-oriented tech roles.",
  "Directors, founders, and senior leadership.",
  "Academic, legal, medical, and formal sectors.",
  "General professional and hybrid-remote roles.",
  "Operations, consulting, and stakeholder-heavy jobs.",
  "Long tenure histories and dense bullet lists.",
  "Finance, strategy, and board-facing profiles.",
  "Healthcare, pharma, and regulated industries.",
  "Tech, SaaS, and digital transformation roles.",
  "Public sector, defense, and compliance-heavy CVs.",
  "Legal, policy, and compliance documentation paths.",
  "Sales, partnerships, and revenue organizations.",
  "Engineering managers and technical program leads.",
  "Data, ML, and analytics-heavy career arcs.",
  "Customer success and professional services.",
  "Design, UX, and creative technology.",
  "Early-career and internship-friendly clarity.",
  "Nonprofit, mission-driven, and education sectors.",
  "Enterprise IT, security, and infrastructure.",
  "Startups, growth teams, and product-led orgs.",
  "Research, labs, and publication-heavy paths.",
  "Manufacturing, supply chain, and logistics.",
  "Real estate, construction, and project delivery.",
  "HR, people ops, and talent leadership.",
  "Media, communications, and content leadership.",
  "Retail, e-commerce, and omnichannel roles.",
  "Energy, sustainability, and infrastructure projects.",
  "Aerospace, defense contracting, and systems integrators.",
  "Insurance, risk, and actuarial career paths.",
  "Hospitality, events, and service leadership.",
  "Banking, credit, and lending organizations.",
  "Biotech, clinical, and research coordination.",
  "Cybersecurity, GRC, and trust & safety.",
  "Executive assistants and chiefs of staff.",
  "Freelance, portfolio-first, and contract-heavy paths.",
];

/** First eight templates keep hand-tuned tokens (preview/PDF parity, known tests). */
const LEGACY_THEMES: Pick<
  Record<TemplateSlug, TemplateTheme>,
  "athena" | "meridian" | "nova" | "helios" | "vanta" | "lumen" | "onyx" | "clio"
> = {
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
    layoutFamily: "classic",
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
    layoutFamily: "classic",
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
    layoutFamily: "classic",
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
    layoutFamily: "classic",
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
    layoutFamily: "classic",
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
    layoutFamily: "classic",
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
    layoutFamily: "classic",
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
    layoutFamily: "classic",
    type: { name: 21, headline: 12, body: 10.75, small: 9, sectionTitle: 9 },
    rhythm: { sectionGap: 14, paragraphGap: 5, bulletIndent: 16, entryGap: 8 },
    pickerTagline: "Traditional serif with burgundy restraint.",
    bestFor: "Academic, legal, medical, and formal sectors.",
  },
};

function buildGeneratedTheme(slug: TemplateSlug, index: number): TemplateTheme {
  const layoutFamily = layoutFamilyFor(slug);
  const hue = (index * 41 + 18) % 360;
  const accent = hslToHex(hue, 38, 42);
  const accentStrong = hslToHex(hue, 42, 22);

  // Sidebar themes use compact header (right column drives the body), photo-banner forces banner.
  const baseHeaderStyle = HEADER_STYLES[index % HEADER_STYLES.length];
  const headerStyle =
    layoutFamily === "photo-banner"
      ? "banner"
      : layoutFamily === "sidebar"
        ? "compact"
        : baseHeaderStyle;

  const sectionTitleStyle = SECTION_STYLES[index % SECTION_STYLES.length];
  const fontFamily: "sans" | "serif" = index % 6 === 2 || index % 6 === 5 ? "serif" : "sans";
  // Sidebars already have a dedicated skills column, so suppress the inline two-col meta.
  const twoColumnMeta = layoutFamily === "sidebar" ? false : index % 7 === 1 || index % 7 === 4;

  const compactish = index % 11 === 3;
  const type = compactish
    ? { name: 17, headline: 10.5, body: 9.5, small: 8.5, sectionTitle: 8.5 }
    : index % 9 === 0
      ? { name: 22, headline: 12, body: 10.75, small: 9, sectionTitle: 9 }
      : { name: 20, headline: 11.5, body: 10.5, small: 9, sectionTitle: 9 };

  const rhythm =
    compactish
      ? { sectionGap: 10, paragraphGap: 4, bulletIndent: 13, entryGap: 6 }
      : index % 5 === 0
        ? { sectionGap: 15, paragraphGap: 5, bulletIndent: 16, entryGap: 8 }
        : { sectionGap: 13, paragraphGap: 5, bulletIndent: 15, entryGap: 7 };

  const pageMarginPt = 44 + (index % 5) * 2;

  const displayName = slug.charAt(0).toUpperCase() + slug.slice(1);

  // Tag non-classic families in the picker copy so users know the photo option exists.
  const baseTagline = TAGLINES[index % TAGLINES.length];
  const pickerTagline =
    layoutFamily === "sidebar"
      ? "Sidebar layout with avatar, contact & skills rail."
      : layoutFamily === "photo-banner"
        ? "Photo banner header — warm, personable executive tone."
        : baseTagline;

  const baseBestFor = BEST_FOR[index % BEST_FOR.length];
  const bestFor =
    layoutFamily === "sidebar"
      ? "Design, product, and portfolios where a photo is welcome (EU/LATAM/Asia)."
      : layoutFamily === "photo-banner"
        ? "Executive, sales, and client-facing roles in photo-friendly markets."
        : baseBestFor;

  return {
    slug,
    name: displayName,
    accent,
    accentStrong,
    pageMarginPt,
    headerStyle,
    sectionTitleStyle,
    fontFamily,
    twoColumnMeta,
    layoutFamily,
    type,
    rhythm,
    pickerTagline,
    bestFor,
  };
}

const THEMES: Record<TemplateSlug, TemplateTheme> = Object.fromEntries(
  TEMPLATE_SLUG_ORDER.map((slug, i) => [
    slug,
    slug in LEGACY_THEMES
      ? LEGACY_THEMES[slug as keyof typeof LEGACY_THEMES]
      : buildGeneratedTheme(slug, i),
  ]),
) as Record<TemplateSlug, TemplateTheme>;

export function getTemplateTheme(slug: TemplateSlug): TemplateTheme {
  return THEMES[slug] ?? THEMES.athena;
}

export const ALL_TEMPLATE_THEMES: TemplateTheme[] = TEMPLATE_SLUG_ORDER.map((s) => THEMES[s]);
