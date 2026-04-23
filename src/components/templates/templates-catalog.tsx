"use client";

import {
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gauge,
  IdCard,
  LayoutGrid,
  Lightbulb,
  Loader2,
  Palette,
  PenLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  ZoomIn,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { TemplateThumbnail } from "@/components/resume-preview/template-thumbnail";
import { TemplateCardHoverChrome } from "@/components/templates/template-card-hover-chrome";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContentFlanked,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import {
  type TemplateCareerFilter,
  type TemplateCatalogCriteria,
  type TemplateColorFilter,
  type TemplateFormatFilter,
  type TemplateIndustryFilter,
  type TemplateStyleFilter,
  type TemplateTagsFilter,
  criteriaHasActiveFilters,
  defaultTemplateCatalogCriteria,
  filterTemplateThemes,
  isPopularTemplate,
} from "@/lib/resume-preview/template-catalog-filters";
import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import type { TemplateTheme } from "@/lib/resume-preview/template-theme";
import { ALL_TEMPLATE_THEMES } from "@/lib/resume-preview/template-theme";
import { createProjectFormAction } from "@/services/projects/actions";
import { cn } from "@/lib/utils";

const PILL_TRIGGER = cn(
  "inline-flex h-9 max-w-full shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium outline-none transition-colors",
  "border-slate-200 bg-slate-50/80 text-slate-700",
  "hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 data-popup-open:bg-slate-100",
);

const PILL_TRIGGER_ACTIVE = "border-[#2268d7]/35 bg-sky-50/90 text-slate-800";

const INDUSTRY_LABEL: Record<TemplateIndustryFilter, string> = {
  all: "All industries",
  tech: "Tech & product",
  finance: "Finance & strategy",
  healthcare: "Healthcare & regulated",
  legal: "Legal & compliance",
  creative: "Creative & marketing",
  operations: "Operations & supply chain",
  general: "General professional",
};

const CAREER_LABEL: Record<TemplateCareerFilter, string> = {
  all: "All stages",
  early: "Entry & early career",
  mid: "Mid-level",
  senior: "Senior & executive",
};

const STYLE_LABEL: Record<TemplateStyleFilter, string> = {
  all: "All styles",
  sans: "Sans-serif",
  serif: "Serif",
};

const FORMAT_LABEL: Record<TemplateFormatFilter, string> = {
  all: "All formats",
  classic: "Single column",
  sidebar: "Sidebar",
  "photo-banner": "Photo header",
};

const COLOR_LABEL: Record<TemplateColorFilter, string> = {
  all: "All colors",
  cool: "Cool tones",
  warm: "Warm tones",
  neutral: "Neutral",
};

const TAGS_LABEL: Record<TemplateTagsFilter, string> = {
  all: "All tags",
  "photo-ready": "Photo-ready",
  compact: "Compact header",
  "two-column-meta": "Two-column meta",
};

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
      : "rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5";

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex flex-col gap-4", toolbarSurface)}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <InputWithIcon
            className="min-w-0 flex-1"
            leading={<Search className="pointer-events-none size-4 text-muted-foreground" aria-hidden />}
          >
            <Input
              type="search"
              value={criteria.search}
              onChange={(e) => setCriteria((c) => ({ ...c, search: e.target.value }))}
              placeholder="Search thousands of templates"
              autoComplete="off"
              aria-label="Search templates"
            />
          </InputWithIcon>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(PILL_TRIGGER, hasFilters && PILL_TRIGGER_ACTIVE)}
            >
              <SlidersHorizontal className="size-4 shrink-0 text-slate-500" aria-hidden />
              <span className="truncate">All filters</span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[12rem]">
              <DropdownMenuItem onSelect={resetAll}>Reset all filters</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(PILL_TRIGGER, criteria.industry !== "all" && PILL_TRIGGER_ACTIVE)}
            >
              <IdCard className="size-4 shrink-0 text-slate-500" aria-hidden />
              <span className="max-w-[10rem] truncate sm:max-w-none">Occupation & Industry</span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[14rem]">
              {(Object.keys(INDUSTRY_LABEL) as TemplateIndustryFilter[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => setCriteria((c) => ({ ...c, industry: key }))}
                >
                  {INDUSTRY_LABEL[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(PILL_TRIGGER, criteria.career !== "all" && PILL_TRIGGER_ACTIVE)}
            >
              <Briefcase className="size-4 shrink-0 text-slate-500" aria-hidden />
              <span className="truncate">Career Stage</span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[12rem]">
              {(Object.keys(CAREER_LABEL) as TemplateCareerFilter[]).map((key) => (
                <DropdownMenuItem key={key} onSelect={() => setCriteria((c) => ({ ...c, career: key }))}>
                  {CAREER_LABEL[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(PILL_TRIGGER, criteria.style !== "all" && PILL_TRIGGER_ACTIVE)}
            >
              <PenLine className="size-4 shrink-0 text-slate-500" aria-hidden />
              <span className="truncate">Style</span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[10rem]">
              {(Object.keys(STYLE_LABEL) as TemplateStyleFilter[]).map((key) => (
                <DropdownMenuItem key={key} onSelect={() => setCriteria((c) => ({ ...c, style: key }))}>
                  {STYLE_LABEL[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(PILL_TRIGGER, criteria.format !== "all" && PILL_TRIGGER_ACTIVE)}
            >
              <LayoutGrid className="size-4 shrink-0 text-slate-500" aria-hidden />
              <span className="truncate">Format</span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[11rem]">
              {(Object.keys(FORMAT_LABEL) as TemplateFormatFilter[]).map((key) => (
                <DropdownMenuItem key={key} onSelect={() => setCriteria((c) => ({ ...c, format: key }))}>
                  {FORMAT_LABEL[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(PILL_TRIGGER, criteria.color !== "all" && PILL_TRIGGER_ACTIVE)}
            >
              <Palette className="size-4 shrink-0 text-slate-500" aria-hidden />
              <span className="truncate">Color</span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[10rem]">
              {(Object.keys(COLOR_LABEL) as TemplateColorFilter[]).map((key) => (
                <DropdownMenuItem key={key} onSelect={() => setCriteria((c) => ({ ...c, color: key }))}>
                  {COLOR_LABEL[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className={cn(PILL_TRIGGER, criteria.tags !== "all" && PILL_TRIGGER_ACTIVE)}
            >
              <Star className="size-4 shrink-0 text-slate-500" aria-hidden />
              <span className="truncate">Tags</span>
              <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[12rem]">
              {(Object.keys(TAGS_LABEL) as TemplateTagsFilter[]).map((key) => (
                <DropdownMenuItem key={key} onSelect={() => setCriteria((c) => ({ ...c, tags: key }))}>
                  {TAGS_LABEL[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        {hasFilters ? (
          <>
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{" "}
            <span className="font-semibold text-slate-900">{total}</span> ATS-friendly templates
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
            Choose from <span className="font-semibold text-slate-900">{total}</span> ATS-friendly templates
          </>
        )}
      </p>

      <ul
        className={cn(
          "mt-6 grid items-start gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4",
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
          )}
        >
          {zoomTheme ? (
            <>
              <DialogDescription className="sr-only">
                Preview of the {zoomTheme.name} resume template. Use Edit this template to start, or arrow
                buttons to browse other templates in the current list.
              </DialogDescription>

              <div
                key={zoomTheme.slug}
                className={cn(
                  "grid min-h-0 md:grid-cols-2 md:grid-rows-1",
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

                <div className="flex min-h-[220px] flex-col items-center justify-center bg-[#E0F2F1] p-6 sm:min-h-[280px] sm:p-8 md:min-h-0 md:py-10">
                  <div className="w-full max-w-[min(100%,280px)] overflow-hidden rounded-lg bg-white/40 p-3 shadow-sm ring-1 ring-teal-900/10 sm:max-w-[300px] sm:p-4">
                    <TemplateThumbnail slug={zoomTheme.slug} className="w-full" />
                  </div>
                  <p className="mt-4 max-w-sm text-center text-xs leading-relaxed text-teal-900/75">
                    {zoomTheme.bestFor}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContentFlanked>
      </Dialog>
    </div>
  );
}

type CardProps = {
  theme: TemplateTheme;
  popular: boolean;
  ringOffsetClass: string;
  signedInApp: boolean;
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
  onPreview,
  createHref,
}: CardProps) {
  const cardBody = (
    <div className="relative">
      <Card className="gap-0 overflow-hidden border-0 bg-white py-0 text-left shadow-none transition-shadow duration-200 group-hover:shadow-none">
        <CardContent className="p-0">
          <div
            className={cn(
              "relative overflow-hidden rounded-md bg-white p-1.5",
              "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.85)]",
              "ring-1 ring-slate-200/50",
              "transition-[box-shadow,ring-color] duration-200 ease-out",
              "group-hover:shadow-[0_2px_6px_rgba(15,23,42,0.07),0_10px_28px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.9)]",
              "group-hover:ring-slate-300/70",
            )}
          >
            <div className="relative z-[1]">
              <TemplateThumbnail slug={theme.slug} className="shadow-none ring-0" />
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
    </div>
  );

  const formShell = cn(
    "group relative block rounded-xl outline-none",
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
          className="absolute inset-0 z-[30] cursor-pointer rounded-xl border-0 bg-transparent p-0 opacity-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2268d7]"
          aria-label={`Edit with ${theme.name} template — creates a draft and opens the studio`}
        />
      </form>
    );
  }

  return (
    <div className={cn("group relative block rounded-xl", ringOffsetClass)}>
      {chrome}
      <Link
        href={createHref}
        className={cn(
          "absolute inset-0 z-[30] rounded-xl outline-none",
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
      className="absolute inset-0 z-[45] flex items-center justify-center rounded-xl bg-white/75 backdrop-blur-[2px]"
      aria-hidden
    >
      <Loader2 className="size-8 animate-spin text-[#2268d7]" aria-hidden />
    </div>
  );
}
