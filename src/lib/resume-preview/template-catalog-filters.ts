import {
  TEMPLATE_SLUG_ORDER,
  type TemplateSlug,
} from "@/lib/resume-preview/template-ids";
import type { TemplateTheme } from "@/lib/resume-preview/template-theme";
import { templateSupportsAvatar } from "@/lib/resume-preview/template-theme";

/** First templates in canonical order — shown with a “Popular” badge in the catalog. */
export const POPULAR_TEMPLATE_SLUGS = new Set<TemplateSlug>(
  TEMPLATE_SLUG_ORDER.slice(0, 4) as TemplateSlug[],
);

export type TemplateIndustryFilter =
  | "all"
  | "tech"
  | "finance"
  | "healthcare"
  | "legal"
  | "creative"
  | "operations"
  | "general";

export type TemplateCareerFilter = "all" | "early" | "mid" | "senior";

export type TemplateStyleFilter = "all" | "sans" | "serif";

export type TemplateFormatFilter = "all" | "classic" | "sidebar" | "photo-banner";

export type TemplateColorFilter = "all" | "cool" | "warm" | "neutral";

export type TemplateTagsFilter = "all" | "photo-ready" | "compact" | "two-column-meta";

export type TemplateCatalogCriteria = {
  search: string;
  industry: TemplateIndustryFilter;
  career: TemplateCareerFilter;
  style: TemplateStyleFilter;
  format: TemplateFormatFilter;
  color: TemplateColorFilter;
  tags: TemplateTagsFilter;
};

const DEFAULT_CRITERIA: TemplateCatalogCriteria = {
  search: "",
  industry: "all",
  career: "all",
  style: "all",
  format: "all",
  color: "all",
  tags: "all",
};

export function defaultTemplateCatalogCriteria(): TemplateCatalogCriteria {
  return { ...DEFAULT_CRITERIA };
}

function haystack(theme: TemplateTheme): string {
  return `${theme.name} ${theme.pickerTagline} ${theme.bestFor}`.toLowerCase();
}

function matchesAny(text: string, needles: readonly string[]): boolean {
  return needles.some((n) => text.includes(n));
}

const INDUSTRY_KEYWORDS: Record<Exclude<TemplateIndustryFilter, "all">, readonly string[]> = {
  tech: [
    "tech",
    "software",
    "engineering",
    "engineer",
    "data",
    "analytics",
    "ml",
    "product",
    "startup",
    "digital",
    "security",
    "infrastructure",
    "it ",
    "design",
    "ux",
    "cyber",
    "technical",
    "saas",
  ],
  finance: [
    "finance",
    "banking",
    "lending",
    "credit",
    "investment",
    "strategy",
    "board",
    "insurance",
    "risk",
    "actuarial",
  ],
  healthcare: [
    "health",
    "medical",
    "pharma",
    "biotech",
    "clinical",
    "healthcare",
  ],
  legal: ["legal", "policy", "compliance", "government", "defense", "academic"],
  creative: [
    "creative",
    "design",
    "ux",
    "marketing",
    "media",
    "content",
    "portfolio",
    "communications",
  ],
  operations: [
    "operations",
    "consulting",
    "logistics",
    "supply",
    "manufacturing",
    "project",
    "construction",
    "real estate",
    "hospitality",
    "retail",
    "e-commerce",
    "energy",
    "infrastructure",
  ],
  general: [
    "general",
    "professional",
    "hybrid",
    "most roles",
    "reliable",
    "conventional",
    "conservative",
    "minimal",
    "nonprofit",
    "education",
    "hr ",
    "people ops",
    "talent",
    "customer success",
    "services",
  ],
};

const SENIOR_HINTS = [
  "senior",
  "executive",
  "director",
  "leadership",
  "founder",
  "board",
  "principal",
  "staff engineer",
  "engineering managers",
  "vp",
  "chief",
  "executives",
];

const EARLY_HINTS = ["early-career", "internship", "intern-friendly", "early career"];

function careerBucket(text: string): "early" | "mid" | "senior" {
  if (matchesAny(text, EARLY_HINTS)) return "early";
  if (matchesAny(text, SENIOR_HINTS)) return "senior";
  return "mid";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Hue 0–360, saturation and lightness 0–1. */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s, l };
}

export function accentColorFamily(theme: TemplateTheme): "cool" | "warm" | "neutral" {
  const rgb = hexToRgb(theme.accent);
  if (!rgb) return "neutral";
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (s < 0.14 || l < 0.06 || l > 0.94) return "neutral";
  if (h <= 58 || h >= 292) return "warm";
  return "cool";
}

export function isPopularTemplate(theme: TemplateTheme): boolean {
  return POPULAR_TEMPLATE_SLUGS.has(theme.slug);
}

export function criteriaHasActiveFilters(c: TemplateCatalogCriteria): boolean {
  return (
    c.search.trim() !== "" ||
    c.industry !== "all" ||
    c.career !== "all" ||
    c.style !== "all" ||
    c.format !== "all" ||
    c.color !== "all" ||
    c.tags !== "all"
  );
}

export function filterTemplateThemes(
  themes: readonly TemplateTheme[],
  criteria: TemplateCatalogCriteria,
): TemplateTheme[] {
  const q = criteria.search.trim().toLowerCase();

  return themes.filter((theme) => {
    const text = haystack(theme);

    if (q) {
      const ok =
        theme.name.toLowerCase().includes(q) ||
        theme.pickerTagline.toLowerCase().includes(q) ||
        theme.bestFor.toLowerCase().includes(q);
      if (!ok) return false;
    }

    if (criteria.industry !== "all") {
      const keys = INDUSTRY_KEYWORDS[criteria.industry];
      if (!matchesAny(text, keys)) return false;
    }

    if (criteria.career !== "all") {
      const bucket = careerBucket(text);
      if (criteria.career === "early" && bucket !== "early") return false;
      if (criteria.career === "senior" && bucket !== "senior") return false;
      if (criteria.career === "mid" && bucket !== "mid") return false;
    }

    if (criteria.style !== "all" && theme.fontFamily !== criteria.style) return false;

    if (criteria.format !== "all" && theme.layoutFamily !== criteria.format) return false;

    if (criteria.color !== "all" && accentColorFamily(theme) !== criteria.color) return false;

    if (criteria.tags !== "all") {
      if (criteria.tags === "photo-ready" && !templateSupportsAvatar(theme)) return false;
      if (
        criteria.tags === "compact" &&
        theme.headerStyle !== "compact" &&
        !theme.twoColumnMeta
      ) {
        return false;
      }
      if (criteria.tags === "two-column-meta" && !theme.twoColumnMeta) return false;
    }

    return true;
  });
}
