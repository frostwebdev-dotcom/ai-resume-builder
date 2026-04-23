import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Dim overlay + “Edit this template” pill — used on `/templates` and `/app/templates`. */
export function TemplateHoverAffordance() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-slate-950/0 transition-colors duration-200 group-hover:bg-slate-950/40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center px-4 pb-6 pt-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:pb-10"
        aria-hidden
      >
        <span
          className={cn(
            "inline-flex max-w-[min(100%,16rem)] items-center justify-center rounded-full px-7 py-2.5 text-center text-sm font-bold tracking-tight shadow-[0_5px_0_0_#0a1f3d]",
            "border border-sky-200/70 bg-sky-100/95 text-[#0c2d5c]",
            "ring-1 ring-white/40",
          )}
        >
          Edit this template
        </span>
      </div>
    </>
  );
}

/** Ring + hover overlay around the card (parent must use Tailwind `group`). */
export function TemplateCardHoverChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl ring-1 ring-slate-200/90 transition-[box-shadow,ring-width,ring-color] duration-200 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-amber-400/90">
      {children}
      <TemplateHoverAffordance />
    </div>
  );
}
