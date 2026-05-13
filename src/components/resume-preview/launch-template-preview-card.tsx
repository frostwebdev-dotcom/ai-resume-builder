import type { ReactNode } from "react";

import type { TemplateSlug } from "@/lib/resume-preview/template-ids";
import { launchTemplateMetadata } from "@/lib/resume-preview/template-metadata";
import { getTemplateTheme } from "@/lib/resume-preview/template-theme";
import { cn } from "@/lib/utils";

type Props = {
  slug: TemplateSlug;
  /** Live preview node (scaled viewport) */
  preview: ReactNode;
  className?: string;
};

/**
 * Marketing / catalog card chrome around the live `ResumePreviewRenderer` thumb.
 */
export function LaunchTemplatePreviewCard({ slug, preview, className }: Props) {
  const meta = launchTemplateMetadata(slug);
  const theme = getTemplateTheme(slug);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]",
        className,
      )}
    >
      <div
        className="border-b border-slate-100 px-4 py-3 sm:px-5"
        style={{ borderLeftWidth: 4, borderLeftColor: theme.accent }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Launch template</p>
        <h3 className="mt-1 text-base font-bold tracking-tight text-slate-900">{theme.name}</h3>
        <p className="mt-1 text-pretty text-sm leading-snug text-slate-600">{meta.headline}</p>
      </div>
      <div className="relative min-h-[200px] flex-1 bg-slate-50/80 p-3 sm:min-h-[220px] sm:p-4">{preview}</div>
      <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] leading-snug text-slate-500 sm:px-5">
        {meta.structureNotes}
      </p>
    </div>
  );
}
