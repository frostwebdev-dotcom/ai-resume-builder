"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { TemplateCatalogLivePreview } from "@/components/templates/template-catalog-live-preview";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/lib/constants";
import {
  DEFAULT_TEMPLATE_SLUG,
  TEMPLATE_SLUG_ORDER,
  type TemplateSlug,
  isTemplateSlug,
} from "@/lib/resume-preview/template-ids";
import {
  LAUNCH_TEMPLATE_RIBBON,
  LAUNCH_TEMPLATE_RIBBON_LABEL,
  launchTemplateMetadata,
  templateCreateUrl,
} from "@/lib/resume-preview/template-metadata";
import { getTemplateTheme, sortTemplateSlugsPhotoCapableFirst } from "@/lib/resume-preview/template-theme";
import { cn } from "@/lib/utils";

type Props = {
  /** When true, guest-oriented copy on the amber notice. */
  guest?: boolean;
  /** When true, hide the sign-in footer line (signed-in app workspace). */
  signedIn?: boolean;
  className?: string;
};

function Ribbon({ kind }: { kind: NonNullable<(typeof LAUNCH_TEMPLATE_RIBBON)[TemplateSlug]> }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full bg-[#2268d7]/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-[#1a4a9c] ring-1 ring-[#2268d7]/20 sm:text-xs">
      {LAUNCH_TEMPLATE_RIBBON_LABEL[kind]}
    </span>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[0.65rem] font-medium text-slate-700 shadow-sm sm:text-xs">
      {children}
    </span>
  );
}

export function TemplatesLaunchGrid({ guest = false, signedIn = false, className }: Props) {
  const searchParams = useSearchParams();
  const [activeSlug, setActiveSlug] = useState<TemplateSlug>(DEFAULT_TEMPLATE_SLUG);
  const [previewSlug, setPreviewSlug] = useState<TemplateSlug | null>(null);

  useEffect(() => {
    const raw = searchParams.get("template");
    if (!raw) return;
    const decoded = decodeURIComponent(raw.trim());
    if (isTemplateSlug(decoded)) setActiveSlug(decoded);
  }, [searchParams]);

  const previewTheme = useMemo(
    () => (previewSlug ? getTemplateTheme(previewSlug) : null),
    [previewSlug],
  );

  const closePreview = useCallback(() => setPreviewSlug(null), []);

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-sm text-amber-950 sm:px-5 sm:py-4">
        <p className="font-semibold text-amber-950">Layout only — your content stays</p>
        <p className="mt-1 text-pretty leading-relaxed text-amber-950/90">
          Picking a template changes fonts, spacing, and section styling. It does{" "}
          <span className="font-medium">not</span> remove or rewrite your experience, projects, or profile text.
          {guest ? " Guest drafts live in your browser until you sign in." : " Your project text stays in the editor."}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick guide</p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-800">
          <li>
            <span className="font-semibold text-slate-900">Layouts:</span>{" "}
            <span className="text-slate-700">
              Each card is a single-column, ATS-minded structure with different accents and rhythm — pick what fits your
              industry and taste.
            </span>
          </li>
          <li>
            <span className="font-semibold text-slate-900">Your text:</span>{" "}
            <span className="text-slate-700">
              Changing templates updates fonts, spacing, and section styling only — it does not rewrite your experience
              or projects.
            </span>
          </li>
          <li>
            <span className="font-semibold text-slate-900">Try before you start:</span>{" "}
            <span className="text-slate-700">Use Preview on a card to zoom the sample résumé, then Use this template.</span>
          </li>
        </ul>
      </div>

      <ul className="mt-8 grid list-none grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
        {sortTemplateSlugsPhotoCapableFirst([...TEMPLATE_SLUG_ORDER]).map((slug) => {
          const theme = getTemplateTheme(slug);
          const meta = launchTemplateMetadata(slug);
          const ribbon = LAUNCH_TEMPLATE_RIBBON[slug];
          const isActive = activeSlug === slug;
          const createUrl = templateCreateUrl(slug);

          return (
            <li key={slug} className="min-w-0">
              <div
                className={cn(
                  "flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-[box-shadow,ring,border-color]",
                  isActive
                    ? "border-[#2268d7]/50 ring-2 ring-[#2268d7]/35"
                    : "border-slate-200/90 ring-1 ring-slate-900/[0.04] hover:border-slate-300 hover:shadow-md",
                )}
              >
                <label className="block cursor-pointer px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
                  <input
                    type="radio"
                    name="launch-template-choice"
                    className="sr-only"
                    checked={isActive}
                    onChange={() => setActiveSlug(slug)}
                  />
                  <span className="block border-l-4 pl-3" style={{ borderLeftColor: theme.accent }}>
                    {ribbon ? (
                      <span className="mb-2 flex flex-wrap gap-2">
                        <Ribbon kind={ribbon} />
                      </span>
                    ) : null}
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{theme.name}</span>
                    </span>
                    <span className="mt-2 flex flex-wrap gap-2">
                      <Badge>ATS-friendly</Badge>
                      <Badge>Mobile-friendly</Badge>
                    </span>
                    <span className="mt-3 block text-pretty text-sm leading-relaxed text-slate-600">{meta.headline}</span>
                    <span className="mt-2 block text-pretty text-sm leading-relaxed text-slate-700">{meta.purpose}</span>
                    <span className="mt-2 block text-xs font-medium text-slate-500">
                      <span className="text-slate-600">Best for:</span> {theme.bestFor}
                    </span>
                  </span>
                </label>

                <div className="relative isolate min-h-[200px] flex-1 bg-gradient-to-b from-slate-50 to-slate-100/90 p-3 sm:min-h-[220px] sm:p-4">
                  <div className="mx-auto h-full w-full max-w-[200px] overflow-hidden rounded-md shadow-sm ring-1 ring-black/5 sm:max-w-[220px]">
                    <TemplateCatalogLivePreview slug={slug} eager className="h-full min-h-[180px] w-full" />
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="touch"
                    className="w-full sm:w-auto sm:min-w-[7.5rem]"
                    onClick={() => {
                      setActiveSlug(slug);
                      setPreviewSlug(slug);
                    }}
                  >
                    Preview
                  </Button>
                  <Link
                    href={createUrl}
                    onClick={() => setActiveSlug(slug)}
                    className={cn(
                      buttonVariants({ size: "touch" }),
                      "inline-flex w-full items-center justify-center bg-[#2268d7] text-white hover:bg-[#1f5fca] sm:ml-auto sm:w-auto sm:flex-1",
                    )}
                  >
                    Use this template
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={previewSlug !== null} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent
          showCloseButton
          className="max-h-[min(92vh,880px)] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto p-4 sm:p-6"
        >
          {previewSlug && previewTheme ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-left text-lg sm:text-xl">{previewTheme.name}</DialogTitle>
                <DialogDescription className="text-left text-sm">
                  Sample content for preview — your own resume will use the same layout, fonts, and spacing.
                </DialogDescription>
              </DialogHeader>
              <div className="mx-auto mt-2 max-h-[min(70vh,640px)] w-full max-w-xl overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2 sm:max-w-2xl sm:p-3">
                <TemplateCatalogLivePreview slug={previewSlug} eager className="min-h-[360px] w-full sm:min-h-[420px]" />
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closePreview}>
                  Close
                </Button>
                <Link
                  href={templateCreateUrl(previewSlug)}
                  onClick={closePreview}
                  className={cn(
                    buttonVariants({ size: "touch" }),
                    "inline-flex w-full items-center justify-center bg-[#2268d7] text-white hover:bg-[#1f5fca] sm:w-auto",
                  )}
                >
                  Use this template
                </Link>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {!signedIn ? (
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Preview and PDF export follow the template selected in your project or guest draft.{" "}
          <Link href={ROUTES.auth.login} className="font-medium text-[#2268d7] underline-offset-2 hover:underline">
            Sign in
          </Link>{" "}
          to save projects to your account.
        </p>
      ) : (
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Your studio draft keeps its text when you change templates — only layout and styling update. Export from{" "}
          <span className="font-medium text-foreground/90">Preview &amp; export</span> when you are ready.
        </p>
      )}
    </div>
  );
}
