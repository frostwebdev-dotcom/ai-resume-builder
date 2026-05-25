"use client";

import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Gauge,
  Building2,
  LayoutGrid,
  Lightbulb,
  Loader2,
  Palette,
  PenLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  XIcon,
  ZoomIn,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import { TemplateCardHoverChrome } from "@/components/templates/template-card-hover-chrome";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContentFlanked,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import {
  type TemplateCatalogCriteria,
  type TemplateCareerStageKey,
  type TemplateCatalogFormatFacetKey,
  type TemplateCatalogTagKey,
  type TemplateIndustryKey,
  TEMPLATE_CATALOG_ACCENT_SWATCHES,
  TEMPLATE_CATALOG_CAREER_STAGE_LABEL,
  TEMPLATE_CATALOG_CAREER_STAGE_ORDER,
  TEMPLATE_CATALOG_FORMAT_FACET_LABEL,
  TEMPLATE_CATALOG_FORMAT_FACET_ORDER,
  TEMPLATE_CATALOG_INDUSTRY_LABEL,
  TEMPLATE_CATALOG_INDUSTRY_ORDER,
  TEMPLATE_CATALOG_STYLE_LOOK_LABEL,
  TEMPLATE_CATALOG_STYLE_LOOK_ORDER,
  TEMPLATE_CATALOG_TAG_LABEL,
  TEMPLATE_CATALOG_TAG_ORDER,
  type TemplateStyleLookKey,
  criteriaHasActiveFilters,
  defaultTemplateCatalogCriteria,
  filterTemplateThemes,
  isPopularTemplate,
  normalizeCatalogAccentHex,
} from "@/lib/resume-preview/template-catalog-filters";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { TemplateTheme } from "@/lib/resume-preview/template-theme";
import { ALL_TEMPLATE_THEMES } from "@/lib/resume-preview/template-theme";
import { createProjectFormAction } from "@/services/projects/actions";
import { cn } from "@/lib/utils";

/** Dropdown scroll rails: avoid `preventDefault` on touch so mobile taps register. */
function keepScrollRailOnMouseOnly(e: { pointerType: string; preventDefault(): void }) {
  if (e.pointerType === "touch") return;
  e.preventDefault();
}

/** “All Filters” — white chip, subtle border, navy label (matches catalog reference). */
const ALL_FILTERS_BUTTON = cn(
  "inline-flex h-11 min-h-[var(--touch-target-min)] max-w-full shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold tracking-tight outline-none transition-[color,background-color,border-color,box-shadow]",
  "border-slate-200 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  "hover:border-slate-300 hover:bg-slate-50/90",
  "focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  "md:h-10 md:min-h-0",
);

const ALL_FILTERS_BUTTON_ACTIVE =
  "border-slate-300/95 bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.06)]";

const ALL_FILTERS_BUTTON_OPEN = "border-slate-400/80 bg-sky-50/60";

/** Search field — same height, radius, and chrome as “All Filters” / toolbar. */
const CATALOG_SEARCH_INPUT = cn(
  "h-11 min-h-[var(--touch-target-min)] w-full rounded-lg border border-slate-200 bg-white py-0 text-base font-normal text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  "placeholder:text-slate-500",
  "transition-[border-color,box-shadow,color] outline-none",
  "focus-visible:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900/12 focus-visible:ring-offset-0",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "md:h-10 md:min-h-0 md:text-sm",
);

/** Navy border + pale cyan when active/open (Career Stage, Style look). */
/** Dropdown / filter triggers — ≥44px tap height on phones; compact on md+. */
const CATALOG_FILTER_MENU_TRIGGER = cn(
  "inline-flex h-11 min-h-[var(--touch-target-min)] max-w-full shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 text-sm font-semibold outline-none transition-colors",
  "border-slate-200 bg-slate-50/80 text-slate-800",
  "hover:bg-sky-50/90 focus-visible:ring-2 focus-visible:ring-slate-900/25 data-popup-open:bg-sky-100",
  "md:h-9 md:min-h-0",
);

const CATALOG_FILTER_MENU_TRIGGER_ON = "border-slate-900 bg-sky-100 text-slate-900 shadow-sm";

const SHEET_FILTER_CHECKBOX = cn(
  "mt-0.5 size-4 shrink-0 rounded border-2 border-slate-900 bg-white accent-slate-900",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900/35",
);

function CreateProjectPendingInline() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return <Loader2 className="size-4 animate-spin" aria-hidden />;
}

type Surface = "marketing" | "app";

export type TemplatesCatalogProps = {
  surface: Surface;
  /** App surface only — signed-out visitors use guest links. */
  guest?: boolean;
  className?: string;
};

export function TemplatesCatalog({ surface, guest = false, className }: TemplatesCatalogProps) {
  const [criteria, setCriteria] = useState<TemplateCatalogCriteria>(() =>
    defaultTemplateCatalogCriteria(),
  );
  /** Slug of template shown in the zoom modal — index derived from `filtered` for prev/next. */
  const [zoomSlug, setZoomSlug] = useState<TemplateSlug | null>(null);
  /** Drives a short enter transition when changing templates inside the zoom modal (not on first open). */
  const [zoomEnterDir, setZoomEnterDir] = useState<"forward" | "back" | null>(null);
  const [industryMenuOpen, setIndustryMenuOpen] = useState(false);
  const [careerMenuOpen, setCareerMenuOpen] = useState(false);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [tagsMenuOpen, setTagsMenuOpen] = useState(false);
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  const [filterSheetSections, setFilterSheetSections] = useState({
    industry: true,
    career: true,
    style: true,
    format: true,
    color: true,
    tags: true,
  });

  function toggleFilterSheetSection(key: keyof typeof filterSheetSections) {
    setFilterSheetSections((s) => ({ ...s, [key]: !s[key] }));
  }

  const filtered = useMemo(
    () => filterTemplateThemes(ALL_TEMPLATE_THEMES, criteria),
    [criteria],
  );

  const zoomIndex = useMemo(() => {
    if (!zoomSlug) return -1;
    return filtered.findIndex((t) => t.slug === zoomSlug);
  }, [filtered, zoomSlug]);

  const zoomTheme = zoomIndex >= 0 ? filtered[zoomIndex] : null;

  useEffect(() => {
    if (zoomSlug && !filtered.some((t) => t.slug === zoomSlug)) {
      setZoomSlug(null);
    }
  }, [filtered, zoomSlug]);

  const total = ALL_TEMPLATE_THEMES.length;
  const hasFilters = criteriaHasActiveFilters(criteria);
  const signedInApp = surface === "app" && !guest;

  const ringOffsetClass =
    surface === "marketing"
      ? "focus-visible:ring-offset-background"
      : "focus-visible:ring-offset-slate-100";

  function resetAll() {
    setCriteria(defaultTemplateCatalogCriteria());
  }

  function toggleIndustryFilter(key: TemplateIndustryKey) {
    setCriteria((c) => {
      const next = new Set(c.industry);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...c, industry: Array.from(next) };
    });
  }

  function clearIndustryFilters() {
    setCriteria((c) => ({ ...c, industry: [] }));
  }

  function toggleCareerStage(key: TemplateCareerStageKey) {
    setCriteria((c) => {
      const next = new Set(c.careerStages);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...c, careerStages: Array.from(next) as TemplateCareerStageKey[] };
    });
  }

  function clearCareerStages() {
    setCriteria((c) => ({ ...c, careerStages: [] }));
  }

  function toggleStyleLook(key: TemplateStyleLookKey) {
    setCriteria((c) => {
      const next = new Set(c.styleLooks);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...c, styleLooks: Array.from(next) as TemplateStyleLookKey[] };
    });
  }

  function clearStyleLooks() {
    setCriteria((c) => ({ ...c, styleLooks: [] }));
  }

  function toggleFormatFacet(key: TemplateCatalogFormatFacetKey) {
    setCriteria((c) => {
      const next = new Set(c.formatFacets);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...c, formatFacets: Array.from(next) as TemplateCatalogFormatFacetKey[] };
    });
  }

  function clearFormatFacets() {
    setCriteria((c) => ({ ...c, formatFacets: [] }));
  }

  function toggleAccentSwatch(hex: string) {
    const canon = normalizeCatalogAccentHex(hex);
    if (!canon) return;
    setCriteria((c) => {
      const next = new Set(
        c.accentSwatches.map((h) => normalizeCatalogAccentHex(h)).filter((h): h is string => Boolean(h)),
      );
      if (next.has(canon)) next.delete(canon);
      else next.add(canon);
      return { ...c, accentSwatches: Array.from(next) };
    });
  }

  function clearAccentSwatches() {
    setCriteria((c) => ({ ...c, accentSwatches: [] }));
  }

  function toggleTagFilter(key: TemplateCatalogTagKey) {
    setCriteria((c) => {
      const next = new Set(c.tagFilters);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...c, tagFilters: Array.from(next) as TemplateCatalogTagKey[] };
    });
  }

  function clearTagFilters() {
    setCriteria((c) => ({ ...c, tagFilters: [] }));
  }

  const tagTriggerLabel =
    criteria.tagFilters.length === 1
      ? TEMPLATE_CATALOG_TAG_LABEL[criteria.tagFilters[0]!]
      : "Tags";

  const formatTriggerLabel =
    criteria.formatFacets.length === 1
      ? TEMPLATE_CATALOG_FORMAT_FACET_LABEL[criteria.formatFacets[0]!]
      : "Format";

  const styleLookTriggerLabel =
    criteria.styleLooks.length === 1
      ? TEMPLATE_CATALOG_STYLE_LOOK_LABEL[criteria.styleLooks[0]!]
      : "Style";

  const industryTriggerLabel =
    criteria.industry.length === 1
      ? TEMPLATE_CATALOG_INDUSTRY_LABEL[criteria.industry[0]!]
      : "Occupation & Industry";

  function goZoom(delta: -1 | 1) {
    if (zoomIndex < 0) return;
    const next = zoomIndex + delta;
    if (next < 0 || next >= filtered.length) return;
    setZoomEnterDir(delta > 0 ? "forward" : "back");
    setZoomSlug(filtered[next]!.slug);
  }

  const flankNavBtnClass = cn(
    "flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-slate-200/95 text-slate-700 shadow-md",
    "transition-[background-color,box-shadow,transform] duration-200 ease-out",
    "hover:bg-slate-300 hover:shadow-lg active:scale-[0.97]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500",
  );

  const toolbarSurface =
    surface === "marketing"
      ? "rounded-2xl border border-border/70 bg-white p-4 shadow-soft sm:p-5"
      : "rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5";

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className={cn("flex min-w-0 flex-col gap-4", toolbarSurface)}>
        {surface === "marketing" ? (
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <InputWithIcon
              className="min-w-0 flex-1"
              leading={<Search className="pointer-events-none size-4 text-slate-500" aria-hidden />}
            >
              <Input
                type="search"
                value={criteria.search}
                onChange={(e) => setCriteria((c) => ({ ...c, search: e.target.value }))}
                placeholder="Search templates by name or role"
                autoComplete="off"
                aria-label="Search templates"
                className={CATALOG_SEARCH_INPUT}
              />
            </InputWithIcon>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:gap-2.5 sm:pb-0">
          {surface === "app" ? (
            <InputWithIcon
              className="min-h-10 min-w-0 max-w-full flex-1 basis-0 items-center sm:min-w-[12rem]"
              leading={<Search className="pointer-events-none size-4 text-slate-500" aria-hidden />}
            >
              <Input
                type="search"
                value={criteria.search}
                onChange={(e) => setCriteria((c) => ({ ...c, search: e.target.value }))}
                placeholder="Search templates by name or role"
                autoComplete="off"
                aria-label="Search templates"
                className={CATALOG_SEARCH_INPUT}
              />
            </InputWithIcon>
          ) : null}

          <button
            type="button"
            className={cn(
              ALL_FILTERS_BUTTON,
              hasFilters && ALL_FILTERS_BUTTON_ACTIVE,
              allFiltersOpen && ALL_FILTERS_BUTTON_OPEN,
            )}
            onClick={() => setAllFiltersOpen(true)}
            aria-expanded={allFiltersOpen}
            aria-controls="template-catalog-filters-sheet"
          >
            <SlidersHorizontal className="size-4 shrink-0 text-slate-900" strokeWidth={2} aria-hidden />
            <span className="truncate">All Filters</span>
          </button>

          <DropdownMenu open={industryMenuOpen} onOpenChange={setIndustryMenuOpen}>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                CATALOG_FILTER_MENU_TRIGGER,
                (criteria.industry.length > 0 || industryMenuOpen) && CATALOG_FILTER_MENU_TRIGGER_ON,
              )}
            >
              <Building2
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  criteria.industry.length > 0 || industryMenuOpen ? "text-slate-900" : "text-slate-600",
                )}
                aria-hidden
              />
              <span className="max-w-[11rem] truncate sm:max-w-[14rem] md:max-w-none">{industryTriggerLabel}</span>
              {industryMenuOpen ? (
                <ChevronUp className="size-4 shrink-0 text-slate-800" aria-hidden />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-slate-600" aria-hidden />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[min(24rem,calc(100vw-2rem))] max-w-[24rem] overflow-hidden border-2 border-slate-900/15 bg-white p-0 shadow-lg ring-1 ring-slate-900/10"
            >
              <div
                className="max-h-[min(20rem,50vh)] overflow-y-auto overscroll-contain py-1 [scrollbar-width:thin]"
                onPointerDown={keepScrollRailOnMouseOnly}
              >
                {TEMPLATE_CATALOG_INDUSTRY_ORDER.map((key) => {
                  const checked = criteria.industry.includes(key);
                  const id = `catalog-industry-${key}`;
                  return (
                    <label
                      key={key}
                      htmlFor={id}
                      className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm font-normal leading-snug text-slate-900 hover:bg-sky-50/60"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleIndustryFilter(key)}
                        className={cn(
                          "mt-0.5 size-4 shrink-0 rounded border-2 border-slate-900 bg-white accent-slate-900",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900/35",
                        )}
                      />
                      <span>{TEMPLATE_CATALOG_INDUSTRY_LABEL[key]}</span>
                    </label>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 bg-white p-2.5">
                <button
                  type="button"
                  onClick={() => {
                    clearIndustryFilters();
                    setIndustryMenuOpen(false);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 w-full rounded-full border-2 border-slate-800/25 bg-white text-sm font-medium text-slate-800 shadow-none hover:bg-slate-50",
                  )}
                >
                  Clear
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={careerMenuOpen} onOpenChange={setCareerMenuOpen}>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                CATALOG_FILTER_MENU_TRIGGER,
                (criteria.careerStages.length > 0 || careerMenuOpen) && CATALOG_FILTER_MENU_TRIGGER_ON,
              )}
            >
              <Briefcase
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  criteria.careerStages.length > 0 || careerMenuOpen ? "text-slate-900" : "text-slate-600",
                )}
                aria-hidden
              />
              <span className="truncate">Career Stage</span>
              {careerMenuOpen ? (
                <ChevronUp className="size-4 shrink-0 text-slate-800" aria-hidden />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-slate-600" aria-hidden />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[min(22rem,calc(100vw-2rem))] max-w-[22rem] overflow-hidden border-2 border-slate-900/15 bg-white p-0 shadow-lg ring-1 ring-slate-900/10"
            >
              <div
                className="max-h-[min(16.5rem,42vh)] overflow-y-auto overscroll-contain py-1 [scrollbar-width:thin]"
                onPointerDown={keepScrollRailOnMouseOnly}
              >
                {TEMPLATE_CATALOG_CAREER_STAGE_ORDER.map((key) => {
                  const checked = criteria.careerStages.includes(key);
                  const id = `catalog-career-${key}`;
                  return (
                    <label
                      key={key}
                      htmlFor={id}
                      className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm font-normal leading-snug text-slate-900 hover:bg-sky-50/60"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCareerStage(key)}
                        className={cn(
                          "mt-0.5 size-4 shrink-0 rounded border-2 border-slate-900 bg-white accent-slate-900",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900/35",
                        )}
                      />
                      <span>{TEMPLATE_CATALOG_CAREER_STAGE_LABEL[key]}</span>
                    </label>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 bg-white p-2.5">
                <button
                  type="button"
                  onClick={() => {
                    clearCareerStages();
                    setCareerMenuOpen(false);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 w-full rounded-full border-2 border-slate-800/25 bg-white text-sm font-medium text-slate-800 shadow-none hover:bg-slate-50",
                  )}
                >
                  Clear
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={styleMenuOpen} onOpenChange={setStyleMenuOpen}>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                CATALOG_FILTER_MENU_TRIGGER,
                (criteria.styleLooks.length > 0 || styleMenuOpen) && CATALOG_FILTER_MENU_TRIGGER_ON,
              )}
            >
              <Palette
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  criteria.styleLooks.length > 0 || styleMenuOpen ? "text-slate-900" : "text-slate-600",
                )}
                aria-hidden
              />
              <span className="truncate">{styleLookTriggerLabel}</span>
              {styleMenuOpen ? (
                <ChevronUp className="size-4 shrink-0 text-slate-800" aria-hidden />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-slate-600" aria-hidden />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[min(22rem,calc(100vw-2rem))] max-w-[22rem] overflow-hidden border-2 border-slate-900/15 bg-white p-0 shadow-lg ring-1 ring-slate-900/10"
            >
              <div
                className="max-h-[min(16.5rem,42vh)] overflow-y-auto overscroll-contain py-1 [scrollbar-width:thin]"
                onPointerDown={keepScrollRailOnMouseOnly}
              >
                {TEMPLATE_CATALOG_STYLE_LOOK_ORDER.map((key) => {
                  const checked = criteria.styleLooks.includes(key);
                  const id = `catalog-style-look-${key}`;
                  return (
                    <label
                      key={key}
                      htmlFor={id}
                      className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm font-normal leading-snug text-slate-900 hover:bg-sky-50/60"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStyleLook(key)}
                        className={cn(
                          "mt-0.5 size-4 shrink-0 rounded border-2 border-slate-900 bg-white accent-slate-900",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900/35",
                        )}
                      />
                      <span>{TEMPLATE_CATALOG_STYLE_LOOK_LABEL[key]}</span>
                    </label>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 bg-white p-2.5">
                <button
                  type="button"
                  onClick={() => {
                    clearStyleLooks();
                    setStyleMenuOpen(false);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 w-full rounded-full border-2 border-slate-800/25 bg-white text-sm font-medium text-slate-800 shadow-none hover:bg-slate-50",
                  )}
                >
                  Clear
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={formatMenuOpen} onOpenChange={setFormatMenuOpen}>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                CATALOG_FILTER_MENU_TRIGGER,
                (criteria.formatFacets.length > 0 || formatMenuOpen) && CATALOG_FILTER_MENU_TRIGGER_ON,
              )}
            >
              <LayoutGrid
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  criteria.formatFacets.length > 0 || formatMenuOpen ? "text-slate-900" : "text-slate-600",
                )}
                aria-hidden
              />
              <span className="truncate">{formatTriggerLabel}</span>
              {formatMenuOpen ? (
                <ChevronUp className="size-4 shrink-0 text-slate-800" aria-hidden />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-slate-600" aria-hidden />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[min(22rem,calc(100vw-2rem))] max-w-[22rem] overflow-hidden border-2 border-slate-900/15 bg-white p-0 shadow-lg ring-1 ring-slate-900/10"
            >
              <div
                className="max-h-[min(20rem,50vh)] overflow-y-auto overscroll-contain py-1 [scrollbar-width:thin]"
                onPointerDown={keepScrollRailOnMouseOnly}
              >
                {TEMPLATE_CATALOG_FORMAT_FACET_ORDER.map((key) => {
                  const checked = criteria.formatFacets.includes(key);
                  const id = `catalog-format-${key}`;
                  return (
                    <label
                      key={key}
                      htmlFor={id}
                      className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm font-normal leading-snug text-slate-900 hover:bg-sky-50/60"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFormatFacet(key)}
                        className={cn(
                          "mt-0.5 size-4 shrink-0 rounded border-2 border-slate-900 bg-white accent-slate-900",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900/35",
                        )}
                      />
                      <span>{TEMPLATE_CATALOG_FORMAT_FACET_LABEL[key]}</span>
                    </label>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 bg-white p-2.5">
                <button
                  type="button"
                  onClick={() => {
                    clearFormatFacets();
                    setFormatMenuOpen(false);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 w-full rounded-full border-2 border-slate-800/25 bg-white text-sm font-medium text-slate-800 shadow-none hover:bg-slate-50",
                  )}
                >
                  Clear
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={colorMenuOpen} onOpenChange={setColorMenuOpen}>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                CATALOG_FILTER_MENU_TRIGGER,
                (criteria.accentSwatches.length > 0 || colorMenuOpen) && CATALOG_FILTER_MENU_TRIGGER_ON,
              )}
            >
              <Palette
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  criteria.accentSwatches.length > 0 || colorMenuOpen ? "text-slate-900" : "text-slate-600",
                )}
                aria-hidden
              />
              <span className="truncate">Color</span>
              {colorMenuOpen ? (
                <ChevronUp className="size-4 shrink-0 text-slate-800" aria-hidden />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-slate-600" aria-hidden />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[min(17rem,calc(100vw-2rem))] max-w-[17rem] overflow-hidden border-2 border-slate-900/15 bg-white p-0 shadow-lg ring-1 ring-slate-900/10"
            >
              <div
                className="grid grid-cols-5 gap-2 p-3"
                onPointerDown={keepScrollRailOnMouseOnly}
              >
                {TEMPLATE_CATALOG_ACCENT_SWATCHES.map((hex) => {
                  const canon = normalizeCatalogAccentHex(hex) ?? hex;
                  const selected = criteria.accentSwatches.some(
                    (h) => (normalizeCatalogAccentHex(h) ?? h) === canon,
                  );
                  const lightSwatch =
                    canon === "#fafafa" || canon === "#f1f5f9" || canon === "#ffffff" || canon === "#e2e8f0";
                  return (
                    <button
                      key={canon}
                      type="button"
                      title={canon}
                      aria-label={`Accent ${canon}`}
                      aria-pressed={selected}
                      onClick={() => toggleAccentSwatch(canon)}
                      className={cn(
                        "size-8 shrink-0 rounded-full transition-[box-shadow,transform] outline-none",
                        "hover:scale-105 focus-visible:ring-2 focus-visible:ring-slate-900/35 focus-visible:ring-offset-2",
                        lightSwatch && "border border-slate-300/90",
                        selected
                          ? "ring-2 ring-slate-900 ring-offset-2 ring-offset-white"
                          : "ring-0 ring-offset-0",
                      )}
                      style={{ backgroundColor: canon }}
                    />
                  );
                })}
              </div>
              <div className="border-t border-slate-200 bg-white p-2.5">
                <button
                  type="button"
                  onClick={() => {
                    clearAccentSwatches();
                    setColorMenuOpen(false);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 w-full rounded-full border-2 border-slate-800/25 bg-white text-sm font-medium text-slate-800 shadow-none hover:bg-slate-50",
                  )}
                >
                  Clear
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={tagsMenuOpen} onOpenChange={setTagsMenuOpen}>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                CATALOG_FILTER_MENU_TRIGGER,
                (criteria.tagFilters.length > 0 || tagsMenuOpen) && CATALOG_FILTER_MENU_TRIGGER_ON,
              )}
            >
              <Star
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  criteria.tagFilters.length > 0 || tagsMenuOpen ? "text-slate-900" : "text-slate-600",
                )}
                aria-hidden
              />
              <span className="truncate">{tagTriggerLabel}</span>
              {tagsMenuOpen ? (
                <ChevronUp className="size-4 shrink-0 text-slate-800" aria-hidden />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-slate-600" aria-hidden />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[min(22rem,calc(100vw-2rem))] max-w-[22rem] overflow-hidden border-2 border-slate-900/15 bg-white p-0 shadow-lg ring-1 ring-slate-900/10"
            >
              <div
                className="max-h-[min(16.5rem,42vh)] overflow-y-auto overscroll-contain py-1 [scrollbar-width:thin]"
                onPointerDown={keepScrollRailOnMouseOnly}
              >
                {TEMPLATE_CATALOG_TAG_ORDER.map((key) => {
                  const checked = criteria.tagFilters.includes(key);
                  const id = `catalog-tag-${key}`;
                  return (
                    <label
                      key={key}
                      htmlFor={id}
                      className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm font-normal leading-snug text-slate-900 hover:bg-sky-50/60"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTagFilter(key)}
                        className={cn(
                          "mt-0.5 size-4 shrink-0 rounded border-2 border-slate-900 bg-white accent-slate-900",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900/35",
                        )}
                      />
                      <span>{TEMPLATE_CATALOG_TAG_LABEL[key]}</span>
                    </label>
                  );
                })}
              </div>
              <div className="border-t border-slate-200 bg-white p-2.5">
                <button
                  type="button"
                  onClick={() => {
                    clearTagFilters();
                    setTagsMenuOpen(false);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 w-full rounded-full border-2 border-slate-800/25 bg-white text-sm font-medium text-slate-800 shadow-none hover:bg-slate-50",
                  )}
                >
                  Clear
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        {hasFilters ? (
          <>
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{" "}
            <span className="font-semibold text-slate-900">{total}</span> curated resume layouts
            {" · "}
            <button
              type="button"
              className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
              onClick={resetAll}
            >
              Clear filters
            </button>
          </>
        ) : (
          <>
            Choose from <span className="font-semibold text-slate-900">{total}</span> curated resume layouts
          </>
        )}
      </p>

      <ul
        className={cn(
          "mt-6 grid items-start",
          surface === "app"
            ? "grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
            : "grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3",
          surface === "marketing" && "text-left",
        )}
      >
        {filtered.map((theme) => (
          <li key={theme.slug} className="min-w-0">
            <TemplateCatalogCard
              theme={theme}
              popular={isPopularTemplate(theme)}
              ringOffsetClass={ringOffsetClass}
              signedInApp={signedInApp}
              expandedCard={surface === "app"}
              onPreview={() => setZoomSlug(theme.slug)}
              createHref={`${ROUTES.create}?template=${encodeURIComponent(theme.slug)}`}
            />
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white/80 px-4 py-8 text-center text-sm text-slate-600">
          No templates match those filters.{" "}
          <button
            type="button"
            className="font-medium text-[#2268d7] underline-offset-2 hover:underline"
            onClick={resetAll}
          >
            Reset filters
          </button>{" "}
          or try a broader search.
        </p>
      ) : null}

      <Dialog
        open={zoomTheme !== null}
        onOpenChange={(open) => {
          if (!open) {
            setZoomSlug(null);
            setZoomEnterDir(null);
          }
        }}
      >
        <DialogContentFlanked
          showCloseButton
          flankHostClassName={
            surface === "app"
              ? "max-w-[min(100vw-1.5rem,calc(72rem+10rem))] md:max-w-[min(100vw-2rem,calc(80rem+10rem))]"
              : undefined
          }
          leftSlot={
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">
              {filtered.length > 1 && zoomIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => goZoom(-1)}
                  className={flankNavBtnClass}
                  aria-label="Previous template"
                >
                  <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
                </button>
              ) : null}
            </div>
          }
          rightSlot={
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">
              {filtered.length > 1 && zoomIndex >= 0 && zoomIndex < filtered.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goZoom(1)}
                  className={flankNavBtnClass}
                  aria-label="Next template"
                >
                  <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
                </button>
              ) : null}
            </div>
          }
          className={cn(
            "max-h-[min(92vh,880px)] gap-0 overflow-hidden p-0 md:max-h-[85vh]",
            "rounded-xl bg-white text-slate-900 shadow-xl ring-1 ring-slate-200/80",
            surface === "app" && "max-w-none md:max-w-[min(94vw,72rem)]",
          )}
        >
          {zoomTheme ? (
            <>
              <DialogDescription className="sr-only">
                Live preview of the {zoomTheme.name} resume template using sample résumé content. Use Edit this
                template to start, or arrow buttons to browse other templates in the current list.
              </DialogDescription>

              <div
                key={zoomTheme.slug}
                className={cn(
                  "grid min-h-0 md:grid-rows-1",
                  surface === "app" ? "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : "md:grid-cols-2",
                  zoomEnterDir === "forward" &&
                    "animate-in fade-in-0 slide-in-from-right-4 duration-200 ease-out motion-reduce:animate-none motion-reduce:opacity-100",
                  zoomEnterDir === "back" &&
                    "animate-in fade-in-0 slide-in-from-left-4 duration-200 ease-out motion-reduce:animate-none motion-reduce:opacity-100",
                )}
              >
                <div className="flex min-h-0 flex-col overflow-y-auto border-b border-slate-200/80 p-6 sm:p-8 md:border-b-0 md:border-r">
                <DialogTitle className="text-left font-serif text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-[1.65rem]">
                  {zoomTheme.name}
                </DialogTitle>
                <p className="mt-2 text-left text-sm font-normal leading-relaxed text-slate-600">
                  {zoomTheme.pickerTagline}
                </p>

                <div className="mt-6">
                  {signedInApp ? (
                    <form key={zoomTheme.slug} action={createProjectFormAction} className="w-full max-w-md">
                      <input type="hidden" name="title" value="Untitled resume" />
                      <input type="hidden" name="templateSlug" value={zoomTheme.slug} />
                      <Button
                        type="submit"
                        className="h-11 w-full rounded-full bg-[#0f766e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(15,118,110,0.35)] hover:bg-[#0d6660]"
                      >
                        <CreateProjectPendingInline />
                        <span className="inline-flex items-center gap-2">Edit this template</span>
                      </Button>
                    </form>
                  ) : (
                    <Link
                      href={`${ROUTES.create}?template=${encodeURIComponent(zoomTheme.slug)}`}
                      className={cn(
                        buttonVariants({ size: "default" }),
                        "inline-flex h-11 w-full max-w-md items-center justify-center rounded-full border-0 bg-[#0f766e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(15,118,110,0.35)] hover:bg-[#0d6660]",
                      )}
                    >
                      Edit this template
                    </Link>
                  )}
                </div>

                <div className="mt-8 border-t border-slate-200 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {total} ATS-friendly layouts include:
                  </p>
                  <ul className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700">
                    <li className="flex gap-3">
                      <Gauge className="mt-0.5 size-5 shrink-0 text-slate-500" strokeWidth={1.5} aria-hidden />
                      <span>
                        <strong className="font-semibold text-slate-900">Customizable</strong> accents and
                        structure so your resume matches your story.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <Lightbulb className="mt-0.5 size-5 shrink-0 text-slate-500" strokeWidth={1.5} aria-hidden />
                      <span>
                        <strong className="font-semibold text-slate-900">Clear</strong> “best for” cues to pick
                        the right look for your path.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-slate-500" strokeWidth={1.5} aria-hidden />
                      <span>
                        <strong className="font-semibold text-slate-900">ATS-linear</strong> reading order and
                        predictable headings for screeners.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <PenLine className="mt-0.5 size-5 shrink-0 text-slate-500" strokeWidth={1.5} aria-hidden />
                      <span>
                        <strong className="font-semibold text-slate-900">Unlimited</strong> template switches in
                        the studio — your content stays put.
                      </span>
                    </li>
                  </ul>
                </div>

                {filtered.length > 1 ? (
                  <div className="mt-6 flex items-center justify-center gap-3 border-t border-slate-100 pt-4 md:hidden">
                    <button
                      type="button"
                      disabled={zoomIndex <= 0}
                      onClick={() => goZoom(-1)}
                      className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-200/95 text-slate-700 shadow transition-[opacity,transform] duration-150 disabled:opacity-40"
                      aria-label="Previous template"
                    >
                      <ChevronLeft className="size-5" aria-hidden />
                    </button>
                    <span className="text-xs text-slate-500">
                      {zoomIndex + 1} / {filtered.length}
                    </span>
                    <button
                      type="button"
                      disabled={zoomIndex >= filtered.length - 1}
                      onClick={() => goZoom(1)}
                      className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-200/95 text-slate-700 shadow transition-[opacity,transform] duration-150 disabled:opacity-40"
                      aria-label="Next template"
                    >
                      <ChevronRight className="size-5" aria-hidden />
                    </button>
                  </div>
                ) : null}
                </div>

                <div
                  className={cn(
                    "flex flex-col items-center justify-center bg-[#E0F2F1] p-6 sm:p-8 md:min-h-0 md:py-10",
                    surface === "app"
                      ? "min-h-[280px] sm:min-h-[340px] md:min-h-[min(100%,720px)]"
                      : "min-h-[220px] sm:min-h-[280px]",
                  )}
                >
                  <div
                    className={cn(
                      "w-full overflow-hidden rounded-lg bg-white/40 shadow-sm ring-1 ring-teal-900/10",
                      surface === "app"
                        ? "max-w-[min(100%,560px)] p-4 sm:max-w-[min(100%,640px)] sm:p-5"
                        : "max-w-[min(100%,320px)] p-3 sm:max-w-[340px] sm:p-4",
                    )}
                  >
                    <TemplateCatalogLivePreview slug={zoomTheme.slug} className="w-full" />
                  </div>
                  <p
                    className={cn(
                      "mt-4 text-center text-xs leading-relaxed text-teal-900/75",
                      surface === "app" ? "max-w-xl sm:text-sm" : "max-w-sm",
                    )}
                  >
                    {zoomTheme.bestFor}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContentFlanked>
      </Dialog>

      <Sheet open={allFiltersOpen} onOpenChange={setAllFiltersOpen}>
        <SheetContent
          id="template-catalog-filters-sheet"
          side="left"
          showCloseButton={false}
          overlayClassName="supports-backdrop-filter:backdrop-blur-none"
          className={cn(
            "gap-0 overflow-hidden border-2 border-slate-200 bg-white p-0 shadow-[8px_0_32px_rgba(15,23,42,0.12)]",
            "data-[side=left]:!top-auto data-[side=left]:!bottom-4 data-[side=left]:!left-3 data-[side=left]:!right-auto data-[side=left]:!h-auto",
            "data-[side=left]:max-h-[min(calc(100dvh-2rem),42rem)] data-[side=left]:w-[min(26rem,calc(100vw-1.25rem))] data-[side=left]:!max-w-none data-[side=left]:rounded-xl",
            "sm:data-[side=left]:!bottom-5 sm:data-[side=left]:!left-4",
          )}
        >
          <SheetDescription className="sr-only">
            Filter templates by occupation, career stage, style, format, accent color, and tags. Changes apply
            immediately; use Apply to close this panel.
          </SheetDescription>
          <div className="flex max-h-[min(calc(100dvh-2rem),42rem)] min-h-0 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <SheetTitle className="text-lg font-semibold tracking-tight text-slate-900">Filters</SheetTitle>
              <SheetClose
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-9 shrink-0 rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  />
                }
              >
                <XIcon className="size-4" aria-hidden />
                <span className="sr-only">Close filters</span>
              </SheetClose>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
              <div className="border-b border-slate-200">
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-50/90"
                  onClick={() => toggleFilterSheetSection("industry")}
                  aria-expanded={filterSheetSections.industry}
                >
                  <Building2 className="size-4 shrink-0 text-slate-800" aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-slate-900">Occupation & Industry</span>
                  <ChevronUp
                    className={cn(
                      "size-4 shrink-0 text-slate-600 transition-transform duration-200",
                      filterSheetSections.industry ? "" : "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {filterSheetSections.industry ? (
                  <div className="max-h-[min(14rem,38vh)] overflow-y-auto overscroll-contain px-4 pb-4 [scrollbar-width:thin]">
                    <div className="space-y-0.5 pt-1">
                      {TEMPLATE_CATALOG_INDUSTRY_ORDER.map((key) => {
                        const checked = criteria.industry.includes(key);
                        const id = `sheet-industry-${key}`;
                        return (
                          <label
                            key={key}
                            htmlFor={id}
                            className="flex cursor-pointer items-start gap-2.5 rounded-md py-2 pr-1 text-sm leading-snug text-slate-800 hover:bg-sky-50/50"
                          >
                            <input
                              id={id}
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleIndustryFilter(key)}
                              className={SHEET_FILTER_CHECKBOX}
                            />
                            <span>{TEMPLATE_CATALOG_INDUSTRY_LABEL[key]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-b border-slate-200">
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-50/90"
                  onClick={() => toggleFilterSheetSection("career")}
                  aria-expanded={filterSheetSections.career}
                >
                  <Briefcase className="size-4 shrink-0 text-slate-800" aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-slate-900">Career Stage</span>
                  <ChevronUp
                    className={cn(
                      "size-4 shrink-0 text-slate-600 transition-transform duration-200",
                      filterSheetSections.career ? "" : "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {filterSheetSections.career ? (
                  <div className="space-y-0.5 px-4 pb-4 pt-1">
                    {TEMPLATE_CATALOG_CAREER_STAGE_ORDER.map((key) => {
                      const checked = criteria.careerStages.includes(key);
                      const id = `sheet-career-${key}`;
                      return (
                        <label
                          key={key}
                          htmlFor={id}
                          className="flex cursor-pointer items-start gap-2.5 rounded-md py-2 pr-1 text-sm leading-snug text-slate-800 hover:bg-sky-50/50"
                        >
                          <input
                            id={id}
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCareerStage(key)}
                            className={SHEET_FILTER_CHECKBOX}
                          />
                          <span>{TEMPLATE_CATALOG_CAREER_STAGE_LABEL[key]}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="border-b border-slate-200">
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-50/90"
                  onClick={() => toggleFilterSheetSection("style")}
                  aria-expanded={filterSheetSections.style}
                >
                  <Palette className="size-4 shrink-0 text-slate-800" aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-slate-900">Style</span>
                  <ChevronUp
                    className={cn(
                      "size-4 shrink-0 text-slate-600 transition-transform duration-200",
                      filterSheetSections.style ? "" : "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {filterSheetSections.style ? (
                  <div className="space-y-0.5 px-4 pb-4 pt-1">
                    {TEMPLATE_CATALOG_STYLE_LOOK_ORDER.map((key) => {
                      const checked = criteria.styleLooks.includes(key);
                      const id = `sheet-style-${key}`;
                      return (
                        <label
                          key={key}
                          htmlFor={id}
                          className="flex cursor-pointer items-start gap-2.5 rounded-md py-2 pr-1 text-sm leading-snug text-slate-800 hover:bg-sky-50/50"
                        >
                          <input
                            id={id}
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStyleLook(key)}
                            className={SHEET_FILTER_CHECKBOX}
                          />
                          <span>{TEMPLATE_CATALOG_STYLE_LOOK_LABEL[key]}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="border-b border-slate-200">
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-50/90"
                  onClick={() => toggleFilterSheetSection("format")}
                  aria-expanded={filterSheetSections.format}
                >
                  <LayoutGrid className="size-4 shrink-0 text-slate-800" aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-slate-900">Format</span>
                  <ChevronUp
                    className={cn(
                      "size-4 shrink-0 text-slate-600 transition-transform duration-200",
                      filterSheetSections.format ? "" : "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {filterSheetSections.format ? (
                  <div className="space-y-0.5 px-4 pb-4 pt-1">
                    {TEMPLATE_CATALOG_FORMAT_FACET_ORDER.map((key) => {
                      const checked = criteria.formatFacets.includes(key);
                      const id = `sheet-format-${key}`;
                      return (
                        <label
                          key={key}
                          htmlFor={id}
                          className="flex cursor-pointer items-start gap-2.5 rounded-md py-2 pr-1 text-sm leading-snug text-slate-800 hover:bg-sky-50/50"
                        >
                          <input
                            id={id}
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFormatFacet(key)}
                            className={SHEET_FILTER_CHECKBOX}
                          />
                          <span>{TEMPLATE_CATALOG_FORMAT_FACET_LABEL[key]}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="border-b border-slate-200">
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-50/90"
                  onClick={() => toggleFilterSheetSection("color")}
                  aria-expanded={filterSheetSections.color}
                >
                  <Droplets className="size-4 shrink-0 text-slate-800" aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-slate-900">Color</span>
                  <ChevronUp
                    className={cn(
                      "size-4 shrink-0 text-slate-600 transition-transform duration-200",
                      filterSheetSections.color ? "" : "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {filterSheetSections.color ? (
                  <div className="grid grid-cols-5 gap-2 px-4 pb-4 pt-1">
                    {TEMPLATE_CATALOG_ACCENT_SWATCHES.map((hex) => {
                      const canon = normalizeCatalogAccentHex(hex) ?? hex;
                      const selected = criteria.accentSwatches.some(
                        (h) => (normalizeCatalogAccentHex(h) ?? h) === canon,
                      );
                      const lightSwatch =
                        canon === "#fafafa" ||
                        canon === "#f1f5f9" ||
                        canon === "#ffffff" ||
                        canon === "#e2e8f0";
                      return (
                        <button
                          key={canon}
                          type="button"
                          title={canon}
                          aria-label={`Accent ${canon}`}
                          aria-pressed={selected}
                          onClick={() => toggleAccentSwatch(canon)}
                          className={cn(
                            "size-8 shrink-0 rounded-full transition-[box-shadow,transform] outline-none",
                            "hover:scale-105 focus-visible:ring-2 focus-visible:ring-slate-900/35 focus-visible:ring-offset-2",
                            lightSwatch && "border border-slate-300/90",
                            selected
                              ? "ring-2 ring-slate-900 ring-offset-2 ring-offset-white"
                              : "ring-0 ring-offset-0",
                          )}
                          style={{ backgroundColor: canon }}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="border-b border-slate-200">
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-50/90"
                  onClick={() => toggleFilterSheetSection("tags")}
                  aria-expanded={filterSheetSections.tags}
                >
                  <Star className="size-4 shrink-0 text-slate-800" aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-slate-900">Tags</span>
                  <ChevronUp
                    className={cn(
                      "size-4 shrink-0 text-slate-600 transition-transform duration-200",
                      filterSheetSections.tags ? "" : "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                {filterSheetSections.tags ? (
                  <div className="space-y-0.5 px-4 pb-4 pt-1">
                    {TEMPLATE_CATALOG_TAG_ORDER.map((key) => {
                      const checked = criteria.tagFilters.includes(key);
                      const id = `sheet-tag-${key}`;
                      return (
                        <label
                          key={key}
                          htmlFor={id}
                          className="flex cursor-pointer items-start gap-2.5 rounded-md py-2 pr-1 text-sm leading-snug text-slate-800 hover:bg-sky-50/50"
                        >
                          <input
                            id={id}
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTagFilter(key)}
                            className={SHEET_FILTER_CHECKBOX}
                          />
                          <span>{TEMPLATE_CATALOG_TAG_LABEL[key]}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-full border-slate-300 bg-white text-sm font-medium text-slate-600 shadow-none hover:bg-slate-50"
                onClick={() => {
                  resetAll();
                  setAllFiltersOpen(false);
                }}
              >
                Clear all
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 rounded-full border border-slate-300/90 bg-sky-100 text-sm font-semibold text-slate-900 shadow-sm hover:bg-sky-200/90"
                onClick={() => setAllFiltersOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

type CardProps = {
  theme: TemplateTheme;
  popular: boolean;
  ringOffsetClass: string;
  signedInApp: boolean;
  /** App /templates: larger preview frame and padding. */
  expandedCard?: boolean;
  onPreview: () => void;
  createHref: string;
};

/** Corner control: sits outside hover chrome so the tooltip is not clipped by overflow-hidden. */
function TemplateZoomPreviewButton({
  onPreview,
  templateName,
}: {
  onPreview: () => void;
  templateName: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Zoom — preview ${templateName}`}
      className={cn(
        "group/zoom absolute bottom-2 right-2 z-40",
        "flex size-10 items-center justify-center rounded-full",
        "bg-sky-200 text-blue-900",
        "ring-2 ring-sky-100/90",
        "shadow-[0_2px_10px_rgba(15,23,42,0.14)]",
        "transition-[transform,box-shadow,background-color,color] duration-200 ease-out",
        "hover:bg-sky-100 hover:text-blue-950 hover:shadow-[0_3px_12px_rgba(15,23,42,0.16)] hover:ring-sky-300/90",
        "active:scale-[0.96]",
        "focus-visible:ring-2 focus-visible:ring-blue-700/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPreview();
      }}
    >
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-[70] mb-2 -translate-x-1/2",
          "whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium tracking-tight text-white",
          "shadow-md ring-1 ring-white/10",
          "opacity-0 transition-opacity duration-150 ease-out",
          "group-hover/zoom:opacity-100 group-hover/zoom:delay-100",
          "group-focus-visible/zoom:opacity-100 group-focus-visible/zoom:delay-0",
        )}
        role="tooltip"
      >
        Zoom
        <span
          className="absolute left-1/2 top-full -mt-px size-0 -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent border-t-slate-900"
          aria-hidden
        />
      </span>
      <ZoomIn className="size-5" strokeWidth={2} aria-hidden />
    </button>
  );
}

function TemplateCatalogCard({
  theme,
  popular,
  ringOffsetClass,
  signedInApp,
  expandedCard = false,
  onPreview,
  createHref,
}: CardProps) {
  const cardBody = (
    <div className="relative">
      <Card className="gap-0 overflow-hidden border-0 bg-white py-0 text-left shadow-none transition-shadow duration-200 group-hover:shadow-none">
        <CardContent className="p-0">
          <div
            className={cn(
              "relative overflow-hidden bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-slate-200/50 transition-[box-shadow,ring-color] duration-200 ease-out group-hover:shadow-[0_2px_6px_rgba(15,23,42,0.07),0_10px_28px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:ring-slate-300/70",
              expandedCard ? "rounded-none p-2.5 sm:p-3" : "rounded-none p-1.5",
            )}
          >
            <div className="relative z-[1]">
              <TemplateCatalogLivePreview slug={theme.slug} className="rounded-none shadow-none ring-0" />
            </div>
            {popular ? (
              <div className="pointer-events-none absolute bottom-2 left-2 z-10">
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/75 bg-[#ffe082] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
                  <Star className="size-3 shrink-0 fill-amber-900 text-amber-900" strokeWidth={1.5} aria-hidden />
                  POPULAR
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const chrome = (
    <div className="relative">
      <TemplateCardHoverChrome>{cardBody}</TemplateCardHoverChrome>
      <TemplateZoomPreviewButton onPreview={onPreview} templateName={theme.name} />
      <div className="relative z-[45] border-x border-b border-slate-200/70 bg-white px-3 py-3 shadow-[0_6px_18px_-16px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{theme.name}</p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-600">{theme.bestFor}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-600/15">
            ATS
          </span>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          {signedInApp ? (
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#0f766e] px-3 text-xs font-bold text-white shadow-sm"
            >
              Use this template
            </button>
          ) : (
            <Link
              href={createHref}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#0f766e] px-3 text-xs font-bold text-white shadow-sm"
            >
              Use this template
            </Link>
          )}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPreview();
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );

  const formShell = cn(
    "group relative block rounded-none outline-none",
    "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2268d7]",
  );

  if (signedInApp) {
    return (
      <form action={createProjectFormAction} className={formShell}>
        <input type="hidden" name="title" value="Untitled resume" />
        <input type="hidden" name="templateSlug" value={theme.slug} />
        {chrome}
        <CreateProjectPendingOverlay />
        <button
          type="submit"
          className="absolute inset-0 z-[30] cursor-pointer rounded-none border-0 bg-transparent p-0 opacity-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2268d7]"
          aria-label={`Edit with ${theme.name} template — creates a draft and opens the studio`}
        />
      </form>
    );
  }

  return (
    <div className={cn("group relative block rounded-none", ringOffsetClass)}>
      {chrome}
      <Link
        href={createHref}
        className={cn(
          "absolute inset-0 z-[30] rounded-none outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#2268d7]/45 focus-visible:ring-offset-2",
          ringOffsetClass,
        )}
        aria-label={`Edit with ${theme.name} template — opens the builder with this layout`}
      />
    </div>
  );
}

function CreateProjectPendingOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div
      className="absolute inset-0 z-[45] flex items-center justify-center rounded-none bg-white/75 backdrop-blur-[2px]"
      aria-hidden
    >
      <Loader2 className="size-8 animate-spin text-[#2268d7]" aria-hidden />
    </div>
  );
}
