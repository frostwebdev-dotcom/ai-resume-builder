"use client";

import {
  Briefcase,
  ChevronDown,
  IdCard,
  LayoutGrid,
  Loader2,
  Palette,
  PenLine,
  Search,
  SlidersHorizontal,
  Star,
  ZoomIn,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { TemplateThumbnail } from "@/components/resume-preview/template-thumbnail";
import { TemplateCardHoverChrome } from "@/components/templates/template-card-hover-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
  const [zoomTheme, setZoomTheme] = useState<TemplateTheme | null>(null);

  const filtered = useMemo(
    () => filterTemplateThemes(ALL_TEMPLATE_THEMES, criteria),
    [criteria],
  );

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
          "mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          surface === "marketing" && "text-left",
        )}
      >
        {filtered.map((theme) => (
          <li key={theme.slug} className="h-full">
            <TemplateCatalogCard
              theme={theme}
              popular={isPopularTemplate(theme)}
              ringOffsetClass={ringOffsetClass}
              signedInApp={signedInApp}
              onPreview={() => setZoomTheme(theme)}
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

      <Dialog open={zoomTheme !== null} onOpenChange={(open) => !open && setZoomTheme(null)}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton>
          {zoomTheme ? (
            <>
              <DialogHeader className="border-b border-slate-100 px-5 py-4 text-left">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <span
                    className="inline-block size-2.5 rounded-full ring-1 ring-black/5"
                    style={{ backgroundColor: zoomTheme.accent }}
                    aria-hidden
                  />
                  {zoomTheme.name}
                </DialogTitle>
              </DialogHeader>
              <div
                className="px-6 py-5"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
                }}
              >
                <div className="mx-auto max-w-sm overflow-hidden rounded-lg ring-1 ring-border/60">
                  <div className="p-3">
                    <TemplateThumbnail slug={zoomTheme.slug} />
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-white px-5 py-4 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </p>
                <DialogDescription className="mt-2 space-y-3 text-sm leading-relaxed text-slate-700">
                  <p className="font-medium text-slate-900">{zoomTheme.pickerTagline}</p>
                  <p className="font-normal text-slate-600">{zoomTheme.bestFor}</p>
                </DialogDescription>
              </div>
              <DialogFooter className="border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:justify-center">
                {signedInApp ? (
                  <form action={createProjectFormAction} className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                    <input type="hidden" name="title" value="Untitled resume" />
                    <input type="hidden" name="templateSlug" value={zoomTheme.slug} />
                    <Button
                      type="submit"
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#2268d7] text-white hover:bg-[#1a56b8] sm:w-auto sm:min-w-[12rem]"
                    >
                      <CreateProjectPendingInline />
                      Use this template
                    </Button>
                  </form>
                ) : (
                  <Link
                    href={`${ROUTES.create}?template=${encodeURIComponent(zoomTheme.slug)}`}
                    className={cn(
                      buttonVariants({ size: "default" }),
                      "h-10 w-full rounded-full border-0 bg-[#2268d7] text-white hover:bg-[#1a56b8] sm:w-auto sm:min-w-[12rem]",
                    )}
                  >
                    Use this template
                  </Link>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
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
        "group/zoom absolute bottom-3 right-3 z-40",
        "flex size-9 items-center justify-center rounded-full",
        "bg-white text-[#2268d7]",
        "ring-1 ring-slate-200/90",
        "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_2px_8px_rgba(15,23,42,0.06)]",
        "transition-[transform,box-shadow,background-color] duration-200 ease-out",
        "hover:bg-slate-50 hover:shadow-[0_2px_6px_rgba(15,23,42,0.07),0_4px_14px_rgba(34,104,215,0.1)] hover:ring-slate-300/80",
        "active:scale-[0.96]",
        "focus-visible:ring-2 focus-visible:ring-[#2268d7]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
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
      <ZoomIn className="size-[17px]" strokeWidth={2} aria-hidden />
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
      <Card className="h-full overflow-hidden border-slate-200/90 bg-white text-left shadow-sm transition-shadow duration-200 group-hover:shadow-md">
        <CardContent className="pt-5">
          <div
            className="relative overflow-hidden rounded-md ring-1 ring-border/60"
            style={{
              background:
                "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
            }}
          >
            <div className="p-2">
              <TemplateThumbnail slug={theme.slug} />
            </div>
            {popular ? (
              <div className="pointer-events-none absolute bottom-2 left-2 z-10">
                <span className="inline-flex items-center gap-0.5 rounded border border-amber-200/90 bg-amber-400/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
                  <Star className="size-3 shrink-0 fill-amber-950 text-amber-950" strokeWidth={1.25} aria-hidden />
                  Popular
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
        <CardHeader className="pb-4 pt-2">
          <CardTitle className="flex items-center gap-2 text-base text-slate-900">
            <span
              className="inline-block size-2.5 rounded-full ring-1 ring-black/5"
              style={{ backgroundColor: theme.accent }}
              aria-hidden
            />
            {theme.name}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );

  const chrome = (
    <div className="relative h-full">
      <TemplateCardHoverChrome>{cardBody}</TemplateCardHoverChrome>
      <TemplateZoomPreviewButton onPreview={onPreview} templateName={theme.name} />
    </div>
  );

  const formShell = cn(
    "group relative block h-full rounded-xl outline-none",
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
    <div className={cn("group relative block h-full rounded-xl", ringOffsetClass)}>
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
