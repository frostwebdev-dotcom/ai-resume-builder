import { ROUTES } from "@/lib/constants";

import type { TemplateSlug } from "@/lib/resume-preview/template-ids";

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

export const LAUNCH_TEMPLATE_METADATA: Record<TemplateSlug, LaunchTemplateMetadata> = {
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

export function launchTemplateMetadata(slug: TemplateSlug): LaunchTemplateMetadata {
  return LAUNCH_TEMPLATE_METADATA[slug];
}

/** Extra lowercase text for `template-catalog-filters` keyword matching. */
export function launchTemplateFilterHaystack(slug: TemplateSlug): string {
  return LAUNCH_TEMPLATE_METADATA[slug].filterHaystack;
}

/** Short ribbon on template pick cards (marketing + app browser). */
export type LaunchTemplateRibbon = "recommended" | "developers" | "polished";

export const LAUNCH_TEMPLATE_RIBBON: Record<TemplateSlug, LaunchTemplateRibbon | null> = {
  "professional-ats": "recommended",
  "modern-professional": "polished",
  "technical-clean": "developers",
};

export const LAUNCH_TEMPLATE_RIBBON_LABEL: Record<LaunchTemplateRibbon, string> = {
  recommended: "Recommended default",
  developers: "Best for developers",
  polished: "Best for polished general use",
};

export function templateCreateUrl(slug: TemplateSlug): string {
  return `${ROUTES.create}?template=${encodeURIComponent(slug)}`;
}
