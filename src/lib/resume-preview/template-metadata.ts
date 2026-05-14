import { ROUTES } from "@/lib/constants";

import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { TEMPLATE_SLUG_ORDER, templatePublicDisplayName } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme, templateSupportsAvatar } from "@/lib/resume-preview/template-theme";

/**
 * Product-facing copy for catalog cards, marketing, and onboarding.
 * Avoid “ATS guarantee” language — describe structure and intent instead.
 */
export type LaunchTemplateMetadata = {
  slug: TemplateSlug;
  /** Short hero line on cards */
  headline: string;
  /** One paragraph for detail panels */
  purpose: string;
  /** Honest structural notes for users who care about parsers */
  structureNotes: string;
  /** Keywords merged into catalog filter haystack (industry facets, search) */
  filterHaystack: string;
};

const CORE_META: Record<
  "professional-ats" | "modern-professional" | "technical-clean",
  LaunchTemplateMetadata
> = {
  "professional-ats": {
    slug: "professional-ats",
    headline: "Maximum compatibility, minimum ornament",
    purpose:
      "Single-column flow, conventional headings, and plain contact lines—built for conservative employers and automated screeners that expect predictable structure.",
    structureNotes:
      "No tables, no skill bars, no charts, no photo slot. Header stays compact; body uses semantic sections and simple bullet lists.",
    filterHaystack:
      "finance business administration legal healthcare government recruiting compliance operations consulting enterprise general professional office support clerical sales retail education nonprofit manufacturing transportation safety security law rehabilitation medical nursing tech innovation technician leadership",
  },
  "modern-professional": {
    slug: "modern-professional",
    headline: "Polished single column with subtle accent rhythm",
    purpose:
      "Same linear parsing path as the ATS layout, with a refined split header for contact details—suited to business, marketing, product, and operations roles.",
    structureNotes:
      "Still one main column for experience and education. Header uses a light two-part layout (not a data table). No photos or decorative graphics.",
    filterHaystack:
      "marketing product growth business development client success strategy operations program management nonprofit education administration customer-facing professional sales retail leadership commerce tech innovation design creative modern",
  },
  "technical-clean": {
    slug: "technical-clean",
    headline: "Dense but readable for builders and ICs",
    purpose:
      "Tighter vertical rhythm for skills and project blocks while keeping a conventional section order you control—aimed at engineers, data, and project-heavy profiles.",
    structureNotes:
      "Single column; skills render as a simple list; projects as titled blocks with plain text—no badges, bars, or icon fonts in the document.",
    filterHaystack:
      "software engineering developer data devops sre security platform infrastructure technical program management machine learning analytics startup saas gitops kubernetes terraform typescript cloud tech innovation technician",
  },
};

const ARCHETYPE_KEYS: Array<"professional-ats" | "modern-professional" | "technical-clean"> = [
  "professional-ats",
  "modern-professional",
  "technical-clean",
];

function archetypeKeyForIndex(i: number): "professional-ats" | "modern-professional" | "technical-clean" {
  return ARCHETYPE_KEYS[i % 3]!;
}

function derivedMetadata(slug: TemplateSlug, i: number): LaunchTemplateMetadata {
  const arch = archetypeKeyForIndex(i);
  const baseHaystack = CORE_META[arch].filterHaystack;
  const display = templatePublicDisplayName(slug);
  return {
    slug,
    headline: `${display} — curated single-column résumé layout`,
    purpose: `${CORE_META[arch].purpose} This variant (${display}) rotates typography rhythm and accent color while keeping the same structural conventions.`,
    structureNotes: CORE_META[arch].structureNotes,
    filterHaystack: `${baseHaystack} ${slug.replace(/-/g, " ")} ${display.toLowerCase()}`,
  };
}

const META_CACHE = new Map<TemplateSlug, LaunchTemplateMetadata>();

export function launchTemplateMetadata(slug: TemplateSlug): LaunchTemplateMetadata {
  const hit = META_CACHE.get(slug);
  if (hit) return hit;

  let built: LaunchTemplateMetadata;
  if (slug === "professional-ats" || slug === "modern-professional" || slug === "technical-clean") {
    built = CORE_META[slug];
  } else {
    const i = TEMPLATE_SLUG_ORDER.indexOf(slug);
    built = i >= 0 ? derivedMetadata(slug, i) : CORE_META["professional-ats"];
  }

  const theme = getTemplateTheme(slug);
  if (templateSupportsAvatar(theme)) {
    const extraHay =
      "photo headshot portrait profile image linkedin personal branding visual two column sidebar banner";
    if (theme.layoutFamily === "photo-banner") {
      built = {
        ...built,
        headline: `${theme.name} — banner layout with optional photo`,
        purpose: `Bold top banner for your name, headline, and optional headshot; experience and education follow in a single main column. ${built.purpose}`,
        structureNotes: `${built.structureNotes} Optional circular headshot appears in the banner when you add a profile image.`,
        filterHaystack: `${built.filterHaystack} ${extraHay}`,
      };
    } else if (theme.layoutFamily === "sidebar") {
      built = {
        ...built,
        headline: `${theme.name} — sidebar layout with optional photo`,
        purpose: `Two-column résumé: tinted rail for your photo, contact, and compact lists; the wider column carries experience and education in a conventional reading order. ${built.purpose}`,
        structureNotes: `${built.structureNotes} Optional headshot renders in the left rail when you add a profile image.`,
        filterHaystack: `${built.filterHaystack} ${extraHay}`,
      };
    }
  }

  META_CACHE.set(slug, built);
  return built;
}

/** Extra lowercase text for `template-catalog-filters` keyword matching. */
export function launchTemplateFilterHaystack(slug: TemplateSlug): string {
  return launchTemplateMetadata(slug).filterHaystack;
}

/** Short ribbon on template pick cards (marketing + app browser). */
export type LaunchTemplateRibbon = "recommended" | "developers" | "polished";

export const LAUNCH_TEMPLATE_RIBBON_LABEL: Record<LaunchTemplateRibbon, string> = {
  recommended: "Recommended default",
  developers: "Best for developers",
  polished: "Best for polished general use",
};

export const LAUNCH_TEMPLATE_RIBBON: Record<TemplateSlug, LaunchTemplateRibbon | null> = Object.fromEntries(
  TEMPLATE_SLUG_ORDER.map((s) => {
    if (s === "professional-ats") return [s, "recommended" as const];
    if (s === "modern-professional") return [s, "polished" as const];
    if (s === "technical-clean") return [s, "developers" as const];
    return [s, null];
  }),
) as Record<TemplateSlug, LaunchTemplateRibbon | null>;

export function templateCreateUrl(slug: TemplateSlug): string {
  return `${ROUTES.create}?template=${encodeURIComponent(slug)}`;
}
