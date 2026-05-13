import {
  TEMPLATE_SLUG_ORDER,
  type TemplateSlug,
} from "@/lib/resume-preview/template-ids";
import { launchTemplateFilterHaystack } from "@/lib/resume-preview/template-metadata";
import type { TemplateTheme } from "@/lib/resume-preview/template-theme";
import { templateSupportsAvatar } from "@/lib/resume-preview/template-theme";

/** Curated launch templates — all shown with a “Popular” badge in the catalog. */
export const POPULAR_TEMPLATE_SLUGS = new Set<TemplateSlug>(
  TEMPLATE_SLUG_ORDER.slice(0, TEMPLATE_SLUG_ORDER.length) as TemplateSlug[],
);

/** Occupation & Industry catalog filter buckets (multi-select). */
export type TemplateIndustryKey =
  | "beverageFoodService"
  | "salesRetail"
  | "artsLeisure"
  | "commerceConstruction"
  | "education"
  | "farmingEnvironmentAgriculture"
  | "financeBusinessAdministration"
  | "lawRehabilitation"
  | "leadership"
  | "maintenance"
  | "manufacturing"
  | "medicalHealthcareSupport"
  | "nursingAidesHomeHealth"
  | "officeSupportClerical"
  | "property"
  | "safetySecurity"
  | "selfCareServices"
  | "socialServicesCommunityEngagement"
  | "techInnovation"
  | "technician"
  | "transportation";

/** Legacy single-select; superseded by `TemplateCareerStageKey` + `careerStages`. */
export type TemplateCareerFilter = "all" | "early" | "mid" | "senior";

/** Multi-select career stages (checkbox UI). Empty = no restriction. */
export type TemplateCareerStageKey = "student" | "early" | "mid" | "senior";

export const TEMPLATE_CATALOG_CAREER_STAGE_ORDER: readonly TemplateCareerStageKey[] = [
  "student",
  "early",
  "mid",
  "senior",
];

export const TEMPLATE_CATALOG_CAREER_STAGE_LABEL: Record<TemplateCareerStageKey, string> = {
  student: "Students",
  early: "Entry Level",
  mid: "Mid Level",
  senior: "Experienced",
};

/** Legacy sans/serif filter; catalog UI uses `TemplateStyleLookKey` + `styleLooks`. */
export type TemplateStyleFilter = "all" | "sans" | "serif";

/** Multi-select “look & feel” (checkbox UI). Empty = no restriction. */
export type TemplateStyleLookKey = "modern" | "creative" | "traditional";

export const TEMPLATE_CATALOG_STYLE_LOOK_ORDER: readonly TemplateStyleLookKey[] = [
  "modern",
  "creative",
  "traditional",
];

export const TEMPLATE_CATALOG_STYLE_LOOK_LABEL: Record<TemplateStyleLookKey, string> = {
  modern: "Modern",
  creative: "Creative",
  traditional: "Traditional",
};

/**
 * Multi-select format facets (checkbox UI). Empty = no format restriction.
 * Matching uses OR across selected facets.
 */
export type TemplateCatalogFormatFacetKey =
  | "singlepage"
  | "oneColumn"
  | "twoColumn"
  | "onePage"
  | "twoPage"
  | "headshot"
  | "noPhoto";

export const TEMPLATE_CATALOG_FORMAT_FACET_ORDER: readonly TemplateCatalogFormatFacetKey[] = [
  "singlepage",
  "oneColumn",
  "twoColumn",
  "onePage",
  "twoPage",
  "headshot",
  "noPhoto",
];

export const TEMPLATE_CATALOG_FORMAT_FACET_LABEL: Record<TemplateCatalogFormatFacetKey, string> = {
  singlepage: "Singlepage",
  oneColumn: "One Column",
  twoColumn: "Two Column",
  onePage: "One Page",
  twoPage: "Two Page",
  headshot: "Headshot",
  noPhoto: "No Photo",
};

/**
 * Fixed 5×7 accent swatches for the catalog Color picker (row-major).
 * Filter uses OR: a template matches if its `accent` is near any selected swatch.
 */
export const TEMPLATE_CATALOG_ACCENT_SWATCHES: readonly string[] = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#06b6d4",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#b45309",
  "#15803d",
  "#0e7490",
  "#1e40af",
  "#6d28d9",
  "#fde047",
  "#fdba74",
  "#fda4af",
  "#86efac",
  "#93c5fd",
  "#44403c",
  "#57534e",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
  "#18181b",
  "#27272a",
  "#fafafa",
  "#f1f5f9",
  "#e2e8f0",
  "#991b1b",
  "#9a3412",
  "#365314",
  "#115e59",
  "#0f172a",
];

/** Multi-select catalog tags (checkbox UI). Empty = no tag restriction. OR across selections. */
export type TemplateCatalogTagKey = "free" | "popular";

export const TEMPLATE_CATALOG_TAG_ORDER: readonly TemplateCatalogTagKey[] = ["free", "popular"];

export const TEMPLATE_CATALOG_TAG_LABEL: Record<TemplateCatalogTagKey, string> = {
  free: "Free",
  popular: "Popular",
};

export type TemplateCatalogCriteria = {
  search: string;
  /**
   * Multi-select (OR): template matches if it matches any selected bucket.
   * Empty means no industry restriction (same as legacy `"all"`).
   */
  industry: readonly TemplateIndustryKey[];
  /**
   * Multi-select (OR): template matches if it fits any selected stage.
   * Empty means no career-stage restriction.
   */
  careerStages: readonly TemplateCareerStageKey[];
  /**
   * Multi-select (OR): `modern` = sans body, `traditional` = serif, `creative` = non-classic layout family.
   */
  styleLooks: readonly TemplateStyleLookKey[];
  /**
   * Multi-select (OR): layout / density / photo facets derived from `TemplateTheme`.
   */
  formatFacets: readonly TemplateCatalogFormatFacetKey[];
  /**
   * Multi-select accent swatches (`#rrggbb`). Empty = no accent-color restriction.
   * Matching uses OR against `TEMPLATE_CATALOG_ACCENT_SWATCHES`.
   */
  accentSwatches: readonly string[];
  /** Multi-select (OR): `popular` = featured picks; `free` = full free-to-use catalog (all templates today). */
  tagFilters: readonly TemplateCatalogTagKey[];
};

const DEFAULT_CRITERIA: TemplateCatalogCriteria = {
  search: "",
  industry: [],
  careerStages: [],
  styleLooks: [],
  formatFacets: [],
  accentSwatches: [],
  tagFilters: [],
};

export function defaultTemplateCatalogCriteria(): TemplateCatalogCriteria {
  return { ...DEFAULT_CRITERIA };
}

/** Normalize a 6-digit theme or swatch hex to `#rrggbb` lowercase. */
export function normalizeCatalogAccentHex(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  return `#${m[1]!.toLowerCase()}`;
}

function rgbDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function accentNearSwatch(themeAccent: string, swatchHex: string): boolean {
  const t = hexToRgb(themeAccent);
  const s = hexToRgb(swatchHex);
  if (!t || !s) return false;
  if (rgbDistance(t, s) <= 88) return true;
  const A = rgbToHsl(t.r, t.g, t.b);
  const B = rgbToHsl(s.r, s.g, s.b);
  if (A.s < 0.1 && B.s < 0.1) {
    return Math.abs(A.l - B.l) < 0.14 && rgbDistance(t, s) < 42;
  }
  const dh = Math.min(Math.abs(A.h - B.h), 360 - Math.abs(A.h - B.h));
  return dh <= 24 && Math.abs(A.s - B.s) < 0.4 && Math.abs(A.l - B.l) < 0.22;
}

function haystack(theme: TemplateTheme): string {
  const extra = launchTemplateFilterHaystack(theme.slug);
  return `${theme.name} ${theme.pickerTagline} ${theme.bestFor} ${extra}`.toLowerCase();
}

function matchesAny(text: string, needles: readonly string[]): boolean {
  return needles.some((n) => text.includes(n));
}

/** Checkbox order for the template catalog “Occupation & Industry” filter. */
export const TEMPLATE_CATALOG_INDUSTRY_ORDER: readonly TemplateIndustryKey[] = [
  "beverageFoodService",
  "salesRetail",
  "artsLeisure",
  "commerceConstruction",
  "education",
  "farmingEnvironmentAgriculture",
  "financeBusinessAdministration",
  "lawRehabilitation",
  "leadership",
  "maintenance",
  "manufacturing",
  "medicalHealthcareSupport",
  "nursingAidesHomeHealth",
  "officeSupportClerical",
  "property",
  "safetySecurity",
  "selfCareServices",
  "socialServicesCommunityEngagement",
  "techInnovation",
  "technician",
  "transportation",
];

export const TEMPLATE_CATALOG_INDUSTRY_LABEL: Record<TemplateIndustryKey, string> = {
  beverageFoodService: "Beverage & Food Service",
  salesRetail: "Sales & Retail",
  artsLeisure: "Arts & Leisure",
  commerceConstruction: "Commerce & Construction",
  education: "Education",
  farmingEnvironmentAgriculture: "Farming, Environment, and Agriculture",
  financeBusinessAdministration: "Finance & Business Administration",
  lawRehabilitation: "Law & Rehabilitation",
  leadership: "Leadership",
  maintenance: "Maintenance",
  manufacturing: "Manufacturing",
  medicalHealthcareSupport: "Medical & Healthcare Support",
  nursingAidesHomeHealth: "Nursing Aides & Home Health Care",
  officeSupportClerical: "Office Support & Clerical",
  property: "Property",
  safetySecurity: "Safety & Security",
  selfCareServices: "Self Care Services",
  socialServicesCommunityEngagement: "Social Services & Community Engagement",
  techInnovation: "Tech & Innovation",
  technician: "Technician",
  transportation: "Transportation",
};

const INDUSTRY_KEYWORDS: Record<TemplateIndustryKey, readonly string[]> = {
  beverageFoodService: [
    "beverage",
    "food service",
    "hospitality",
    "restaurant",
    "culinary",
    "catering",
    "hotel",
    "events",
    "service leadership",
  ],
  salesRetail: [
    "sales",
    "retail",
    "revenue",
    "e-commerce",
    "merchandising",
    "store",
    "partnerships",
    "customer-facing",
    "commercial",
    "customer success",
  ],
  artsLeisure: [
    "creative",
    "design",
    "ux",
    "marketing",
    "media",
    "content",
    "portfolio",
    "communications",
    "arts",
    "leisure",
  ],
  commerceConstruction: [
    "construction",
    "commerce",
    "consulting",
    "logistics",
    "supply",
    "project delivery",
    "real estate",
    "infrastructure",
    "manufacturing",
    "energy",
  ],
  education: [
    "education",
    "academic",
    "university",
    "teaching",
    "school",
    "campus",
    "nonprofit",
    "mission-driven",
  ],
  farmingEnvironmentAgriculture: [
    "farming",
    "agriculture",
    "environment",
    "sustainability",
    "energy",
    "forestry",
    "conservation",
    "rural",
  ],
  financeBusinessAdministration: [
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
    "business",
    "administration",
  ],
  lawRehabilitation: [
    "legal",
    "law",
    "policy",
    "compliance",
    "government",
    "defense",
    "rehabilitation",
    "regulated",
  ],
  leadership: [
    "leadership",
    "executive",
    "director",
    "founder",
    "board",
    "vp",
    "chief",
    "senior leadership",
    "management",
  ],
  maintenance: ["maintenance", "facilities", "reliability", "operations", "field service"],
  manufacturing: ["manufacturing", "plant", "production", "industrial", "supply chain"],
  medicalHealthcareSupport: [
    "health",
    "medical",
    "pharma",
    "biotech",
    "clinical",
    "healthcare",
    "regulated fields",
    "patient",
  ],
  nursingAidesHomeHealth: [
    "nursing",
    "nurse",
    "home health",
    "aide",
    "bedside",
    "caregiver",
    "hospice",
  ],
  officeSupportClerical: [
    "administrative",
    "clerical",
    "office",
    "executive assistant",
    "chief of staff",
    "coordination",
    "people ops",
    "hr ",
    "talent",
  ],
  property: ["property", "leasing", "facilities", "real estate", "estate"],
  safetySecurity: [
    "security",
    "safety",
    "cyber",
    "grc",
    "trust",
    "compliance-heavy",
    "defense contracting",
  ],
  selfCareServices: ["wellness", "beauty", "spa", "fitness", "personal care", "salon"],
  socialServicesCommunityEngagement: [
    "nonprofit",
    "community",
    "social",
    "mission",
    "human services",
    "engagement",
    "volunteer",
  ],
  techInnovation: [
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
    "saas",
    "it ",
    "infrastructure",
    "technical",
  ],
  technician: ["technician", "technical program", "labs", "systems integrator", "support"],
  transportation: [
    "transportation",
    "logistics",
    "shipping",
    "freight",
    "fleet",
    "supply chain",
    "delivery",
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

const STUDENT_HINTS = [
  "student",
  "intern",
  "internship",
  "campus",
  "graduate",
  "graduation",
  "university",
  "college",
  "undergrad",
  "academic",
  "first job",
  "entry role",
];

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
    c.industry.length > 0 ||
    c.careerStages.length > 0 ||
    c.styleLooks.length > 0 ||
    c.formatFacets.length > 0 ||
    c.accentSwatches.length > 0 ||
    c.tagFilters.length > 0
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

    if (criteria.industry.length > 0) {
      const matchesSelected = criteria.industry.some((key) =>
        matchesAny(text, INDUSTRY_KEYWORDS[key]),
      );
      if (!matchesSelected) return false;
    }

    if (criteria.careerStages.length > 0) {
      const bucket = careerBucket(text);
      const matchesStage = criteria.careerStages.some((stage) => {
        if (stage === "student") return matchesAny(text, STUDENT_HINTS);
        if (stage === "early") return bucket === "early";
        if (stage === "mid") return bucket === "mid";
        return bucket === "senior";
      });
      if (!matchesStage) return false;
    }

    if (criteria.styleLooks.length > 0) {
      const matchesLook = criteria.styleLooks.some((look) => {
        if (look === "modern") return theme.fontFamily === "sans";
        if (look === "traditional") return theme.fontFamily === "serif";
        return theme.layoutFamily !== "classic";
      });
      if (!matchesLook) return false;
    }

    if (criteria.formatFacets.length > 0) {
      const matchesFacet = criteria.formatFacets.some((facet) => {
        switch (facet) {
          case "singlepage":
            // Dense, one-sheet-friendly rhythm / type (distinct from column structure).
            return (
              theme.headerStyle === "compact" ||
              (theme.type.body <= 9.75 && theme.rhythm.sectionGap <= 11)
            );
          case "oneColumn":
            return theme.layoutFamily === "classic" && !theme.twoColumnMeta;
          case "twoColumn":
            return theme.twoColumnMeta || theme.layoutFamily !== "classic";
          case "onePage":
            return (
              theme.headerStyle === "compact" ||
              theme.type.body <= 10 ||
              (theme.rhythm.sectionGap <= 12 && theme.pageMarginPt <= 48)
            );
          case "twoPage":
            return (
              theme.headerStyle === "banner" ||
              theme.pageMarginPt >= 50 ||
              (theme.type.body >= 10.5 && theme.rhythm.sectionGap >= 13)
            );
          case "headshot":
            return templateSupportsAvatar(theme);
          case "noPhoto":
            return !templateSupportsAvatar(theme);
          default:
            return false;
        }
      });
      if (!matchesFacet) return false;
    }

    if (criteria.accentSwatches.length > 0) {
      const matchesSwatch = criteria.accentSwatches.some((sw) => accentNearSwatch(theme.accent, sw));
      if (!matchesSwatch) return false;
    }

    if (criteria.tagFilters.length > 0) {
      const matchesTag = criteria.tagFilters.some((tag) => {
        if (tag === "popular") return isPopularTemplate(theme);
        return true;
      });
      if (!matchesTag) return false;
    }

    return true;
  });
}
