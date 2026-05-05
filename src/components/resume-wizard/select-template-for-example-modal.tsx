"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpenCheck, Eye, MoreHorizontal, Search } from "lucide-react";

import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import { TemplateThumbnail } from "@/components/resume-preview/template-thumbnail";
import { Button } from "@/components/ui/button";
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
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
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
    if (!q) return [...TEMPLATE_SLUG_ORDER];
    return TEMPLATE_SLUG_ORDER.filter((slug) => {
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
                <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((slug) => {
                    const theme = getTemplateTheme(slug);
                    const isCurrent = slug === currentSlug;
                    return (
                      <li key={slug} className="min-w-0">
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={`Start from example using ${theme.name} template`}
                          onClick={() => startFrom(slug)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              startFrom(slug);
                            }
                          }}
                          className={cn(
                            "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm outline-none transition-[border-color,box-shadow,transform]",
                            "border-border/80 hover:border-[#2268d7]/45 hover:shadow-md",
                            "focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            "motion-safe:active:scale-[0.99] motion-reduce:active:scale-100",
                            isCurrent && "ring-1 ring-[#2268d7]/35",
                          )}
                        >
                          {isCurrent ? (
                            <span className="absolute left-2 top-2 z-[1] rounded-full bg-[#2268d7]/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[#2268d7]">
                              Current
                            </span>
                          ) : null}
                          <div className="border-b border-border/50 bg-muted/20 p-3">
                            <TemplateThumbnail
                              slug={slug}
                              className="aspect-[210/297] w-full max-h-[11.5rem] shadow-sm"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1 px-3 pb-10 pt-2.5">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {theme.name}
                            </span>
                            <span className="line-clamp-2 text-xs text-muted-foreground">
                              Example résumé tailored to this layout.
                            </span>
                          </div>

                          <div
                            className="absolute bottom-2 right-2 z-[1]"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                type="button"
                                aria-label={`More actions for ${theme.name}`}
                                className={cn(
                                  "inline-flex size-9 items-center justify-center rounded-full border border-border/90 bg-background/95 text-muted-foreground shadow-sm outline-none",
                                  "hover:bg-muted hover:text-foreground",
                                  "focus-visible:ring-2 focus-visible:ring-[#2268d7]/40 focus-visible:ring-offset-2",
                                )}
                              >
                                <MoreHorizontal className="size-4" aria-hidden />
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
