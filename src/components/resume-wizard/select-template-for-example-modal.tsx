"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpenCheck, Eye, MoreHorizontal, Search, Star } from "lucide-react";

import { TemplateCardHoverChrome } from "@/components/templates/template-card-hover-chrome";
import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import { isPopularTemplate } from "@/lib/resume-preview/template-catalog-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { TEMPLATE_SLUG_ORDER, type TemplateSlug } from "@/lib/resume-preview/template-ids";
import { getTemplateTheme, sortTemplateSlugsPhotoCapableFirst } from "@/lib/resume-preview/template-theme";
import { cn } from "@/lib/utils";

export type SelectTemplateForExampleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Highlight which template is currently active in the studio. */
  currentSlug: TemplateSlug;
  /** Apply demo wizard state for this template and close the dialog. */
  onSelectTemplate: (slug: TemplateSlug) => void;
};

export function SelectTemplateForExampleModal({
  open,
  onOpenChange,
  currentSlug,
  onSelectTemplate,
}: SelectTemplateForExampleModalProps) {
  const [query, setQuery] = useState("");
  const [previewSlug, setPreviewSlug] = useState<TemplateSlug | null>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setPreviewSlug(null);
    }
  }, [open]);

  useEffect(() => {
    if (!previewSlug) return;
    const id = window.requestAnimationFrame(() => {
      previewPanelRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [previewSlug]);

  useEffect(() => {
    if (!previewSlug || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setPreviewSlug(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [previewSlug, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortTemplateSlugsPhotoCapableFirst([...TEMPLATE_SLUG_ORDER]);
    return sortTemplateSlugsPhotoCapableFirst([...TEMPLATE_SLUG_ORDER]).filter((slug) => {
      const name = getTemplateTheme(slug).name.toLowerCase();
      return name.includes(q) || slug.toLowerCase().includes(q);
    });
  }, [query]);

  const startFrom = useCallback(
    (slug: TemplateSlug) => {
      onSelectTemplate(slug);
    },
    [onSelectTemplate],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "!flex h-[min(90vh,46rem)] w-[calc(100%-1.5rem)] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden p-0 sm:max-w-4xl",
          "gap-0 rounded-xl sm:rounded-xl",
        )}
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border/70 bg-popover px-4 pb-3 pt-4 pr-14 sm:pr-16">
            <DialogHeader className="gap-1 space-y-0 text-left">
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                Select a Template
              </DialogTitle>
              <DialogDescription className="sr-only">
                Choose a resume template to load example content. Use search to filter the list.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="shrink-0 border-b border-border/70 bg-popover px-4 py-3">
            <label className="sr-only" htmlFor="template-example-search">
              Search templates
            </label>
            <InputWithIcon
              leading={<Search className="text-muted-foreground" aria-hidden />}
              className="w-full"
            >
              <Input
                id="template-example-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                autoComplete="off"
                className="h-10 bg-background/80 sm:h-9"
              />
            </InputWithIcon>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              className="h-full min-h-0 overflow-y-auto overscroll-y-contain px-4 py-4"
              inert={previewSlug ? true : undefined}
            >
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No templates match your search.
                </p>
              ) : (
                <ul className="mx-auto grid max-w-[90rem] list-none grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {filtered.map((slug) => {
                    const theme = getTemplateTheme(slug);
                    const isCurrent = slug === currentSlug;
                    const popular = isPopularTemplate(theme);
                    return (
                      <li key={slug} className="min-w-0">
                        <div className="group relative block rounded-none outline-none focus-within:ring-2 focus-within:ring-[#2268d7]/45 focus-within:ring-offset-2 focus-within:ring-offset-background">
                          <div className="relative">
                            <TemplateCardHoverChrome>
                              <div className="relative">
                                <Card className="gap-0 overflow-hidden border-0 bg-white py-0 text-left shadow-none transition-shadow duration-200 group-hover:shadow-none">
                                  <CardContent className="p-0">
                                    <div
                                      className={cn(
                                        "relative overflow-hidden bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_4px_14px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-slate-200/50 transition-[box-shadow,ring-color] duration-200 ease-out group-hover:shadow-[0_2px_6px_rgba(15,23,42,0.07),0_10px_28px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:ring-slate-300/70",
                                        "rounded-none p-2.5 sm:p-3",
                                      )}
                                    >
                                      <div className="relative z-[1]">
                                        <TemplateCatalogLivePreview
                                          slug={slug}
                                          className="rounded-none shadow-none ring-0"
                                        />
                                      </div>
                                      {popular ? (
                                        <div className="pointer-events-none absolute bottom-2 left-2 z-10">
                                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/75 bg-[#ffe082] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
                                            <Star
                                              className="size-3 shrink-0 fill-amber-900 text-amber-900"
                                              strokeWidth={1.5}
                                              aria-hidden
                                            />
                                            POPULAR
                                          </span>
                                        </div>
                                      ) : null}
                                      {isCurrent ? (
                                        <div className="pointer-events-none absolute left-2 top-2 z-10">
                                          <span className="inline-flex rounded-md border border-[#2268d7]/35 bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2268d7] shadow-sm">
                                            Current
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </TemplateCardHoverChrome>

                            <div
                              className="absolute bottom-2 right-2 z-40"
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  type="button"
                                  aria-label={`More actions for ${theme.name}`}
                                  className={cn(
                                    "flex size-10 items-center justify-center rounded-full",
                                    "bg-white/95 text-slate-700 ring-2 ring-white/90",
                                    "shadow-[0_2px_10px_rgba(15,23,42,0.14)]",
                                    "transition-[transform,box-shadow,background-color,color] duration-200 ease-out",
                                    "hover:bg-slate-50 hover:text-slate-900 hover:shadow-[0_3px_12px_rgba(15,23,42,0.16)]",
                                    "active:scale-[0.96]",
                                    "outline-none focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                                  )}
                                >
                                  <MoreHorizontal className="size-5" strokeWidth={2} aria-hidden />
                                </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                sideOffset={6}
                                className="min-w-[13.5rem] rounded-xl border border-neutral-200 bg-popover p-1 py-1.5 shadow-lg ring-1 ring-black/[0.06]"
                              >
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2.5 text-[0.9375rem]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startFrom(slug);
                                  }}
                                >
                                  <BookOpenCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
                                  Start from this template
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2.5 rounded-md px-2.5 py-2.5 text-[0.9375rem]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewSlug(slug);
                                  }}
                                >
                                  <Eye className="size-4 shrink-0 text-sky-600" aria-hidden />
                                  Preview
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={cn(
                              "absolute inset-0 z-[30] rounded-none border-0 bg-transparent p-0 opacity-0 outline-none",
                              "focus-visible:outline-none",
                            )}
                            aria-label={`Start from example using ${theme.name} template`}
                            onClick={() => startFrom(slug)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {previewSlug ? (
              <div
                ref={previewPanelRef}
                tabIndex={-1}
                role="region"
                aria-labelledby="template-preview-title"
                className="absolute inset-0 z-20 flex flex-col bg-popover/98 shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] outline-none backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
              >
                <div className="flex shrink-0 items-center gap-3 border-b border-border/70 px-3 py-2.5 sm:px-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setPreviewSlug(null)}
                  >
                    Back to templates
                  </Button>
                  <h2
                    id="template-preview-title"
                    className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-foreground sm:text-base"
                  >
                    {getTemplateTheme(previewSlug).name}
                  </h2>
                  <span className="w-[5.5rem] shrink-0 sm:w-28" aria-hidden />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6">
                  <div className="mx-auto w-full max-w-md">
                    <TemplateCatalogLivePreview slug={previewSlug} className="shadow-md ring-1 ring-black/[0.06]" />
                  </div>
                  <p className="mx-auto mt-4 max-w-md text-center text-xs text-muted-foreground">
                    Sample content for preview. Close with Back or press Escape to return to the list.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
