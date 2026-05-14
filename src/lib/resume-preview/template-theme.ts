import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { TEMPLATE_SLUG_ORDER, templatePublicDisplayName } from "@/lib/resume-preview/template-ids";

/**
 * Structural layout family.
 * - `classic` — single column, no embedded photo slot.
 * - `sidebar` — two-column with optional headshot in the left rail.
 * - `photo-banner` — single column with optional headshot in a top banner band.
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

/** Distinct accents for catalog variety (preview + PDF stay in sync via theme). */
const ACCENT_CYCLE = [
  "#1e3a8a",
  "#2268d7",
  "#0f766e",
  "#7c3aed",
  "#b45309",
  "#be123c",
  "#0e7490",
  "#4338ca",
  "#15803d",
  "#c2410c",
] as const;

function accentPairForIndex(i: number): { accent: string; accentStrong: string } {
  const accent = ACCENT_CYCLE[i % ACCENT_CYCLE.length]!;
  const strong =
    i % 3 === 0 ? "#0f172a" : i % 3 === 1 ? "#134e4a" : i % 3 === 2 ? "#1e1b4b" : "#0f172a";
  return { accent, accentStrong: strong };
}

const CORE_PROFESSIONAL_ATS: Omit<TemplateTheme, "slug" | "name"> = {
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
  pickerTagline: "Maximum compatibility, minimum ornament",
  bestFor:
    "Conservative employers, recruiting volume, and roles where predictable structure matters more than styling.",
};

const CORE_MODERN_PROFESSIONAL: Omit<TemplateTheme, "slug" | "name"> = {
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
  pickerTagline: "Polished single column with subtle accent rhythm",
  bestFor:
    "Business, marketing, product, operations, and general professional paths that still want a polished feel.",
};

const CORE_TECHNICAL_CLEAN: Omit<TemplateTheme, "slug" | "name"> = {
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
  pickerTagline: "Dense but readable for builders and ICs",
  bestFor:
    "Developers, data, platform, and project-heavy IC resumes that need density without decorative noise.",
};

const ARCHETYPE_CORES: readonly Omit<TemplateTheme, "slug" | "name">[] = [
  CORE_PROFESSIONAL_ATS,
  CORE_MODERN_PROFESSIONAL,
  CORE_TECHNICAL_CLEAN,
];

/** Banner header + optional headshot (still linear body for ATS-style reading). */
const PHOTO_BANNER_SLUGS = new Set<TemplateSlug>(["onyx", "lumen", "zephyr", "pacific", "vertex"]);

/** Two-column rail + main; headshot and contact in the tinted rail. */
const SIDEBAR_SLUGS = new Set<TemplateSlug>(["helios", "iris", "jade", "fjord", "matrix"]);

function buildTemplateTheme(slug: TemplateSlug): TemplateTheme {
  const i = TEMPLATE_SLUG_ORDER.indexOf(slug);

  if (slug === "professional-ats") {
    return { slug, name: templatePublicDisplayName(slug), ...CORE_PROFESSIONAL_ATS };
  }
  if (slug === "modern-professional") {
    return { slug, name: templatePublicDisplayName(slug), ...CORE_MODERN_PROFESSIONAL };
  }
  if (slug === "technical-clean") {
    return { slug, name: templatePublicDisplayName(slug), ...CORE_TECHNICAL_CLEAN };
  }

  const base = ARCHETYPE_CORES[i % 3]!;
  const { accent, accentStrong } = accentPairForIndex(i);
  const display = templatePublicDisplayName(slug);

  if (PHOTO_BANNER_SLUGS.has(slug)) {
    return {
      ...base,
      slug,
      name: display,
      accent,
      accentStrong,
      layoutFamily: "photo-banner",
      headerStyle: "banner",
      sectionTitleStyle: "accent-rule",
      twoColumnMeta: false,
      pageMarginPt: 50,
      fontFamily: i % 4 === 0 ? "serif" : "sans",
      pickerTagline: `${display} — banner header with room for your photo; body stays a single readable column.`,
      bestFor:
        "Client-facing, leadership, and creative-adjacent roles where a confident visual first impression pairs with conventional section flow.",
    };
  }

  if (SIDEBAR_SLUGS.has(slug)) {
    return {
      ...base,
      slug,
      name: display,
      accent,
      accentStrong,
      layoutFamily: "sidebar",
      headerStyle: "compact",
      sectionTitleStyle: "rule",
      twoColumnMeta: true,
      pageMarginPt: 46,
      type: { name: 16.5, headline: 10.25, body: 10.25, small: 8.75, sectionTitle: 8.75 },
      rhythm: { sectionGap: 12, paragraphGap: 4.5, bulletIndent: 14, entryGap: 7 },
      pickerTagline: `${display} — sidebar résumé with photo rail; skills and certifications read beside your story.`,
      bestFor:
        "Profiles that benefit from a structured two-column look—design, product, consulting, and relationship-heavy careers.",
    };
  }

  return {
    ...base,
    slug,
    name: display,
    accent,
    accentStrong,
    pickerTagline: `${display} — single-column layout tuned for readability and consistent PDF export.`,
    bestFor: base.bestFor,
  };
}

export function getTemplateTheme(slug: TemplateSlug): TemplateTheme {
  return buildTemplateTheme(slug);
}

/** Photo / sidebar layouts first, then classic-only templates (registry UUID order within each group). */
export function sortTemplateSlugsPhotoCapableFirst(slugs: readonly TemplateSlug[]): TemplateSlug[] {
  return [...slugs].sort((a, b) => {
    const da = templateSupportsAvatar(getTemplateTheme(a)) ? 0 : 1;
    const db = templateSupportsAvatar(getTemplateTheme(b)) ? 0 : 1;
    if (da !== db) return da - db;
    return TEMPLATE_SLUG_ORDER.indexOf(a) - TEMPLATE_SLUG_ORDER.indexOf(b);
  });
}

export function sortThemesPhotoCapableFirst(themes: readonly TemplateTheme[]): TemplateTheme[] {
  return [...themes].sort((a, b) => {
    const da = templateSupportsAvatar(a) ? 0 : 1;
    const db = templateSupportsAvatar(b) ? 0 : 1;
    if (da !== db) return da - db;
    return TEMPLATE_SLUG_ORDER.indexOf(a.slug) - TEMPLATE_SLUG_ORDER.indexOf(b.slug);
  });
}

export const ALL_TEMPLATE_THEMES: TemplateTheme[] = sortThemesPhotoCapableFirst(
  TEMPLATE_SLUG_ORDER.map((s) => buildTemplateTheme(s)),
);
