import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Dim overlay + centered teal CTA — used on `/templates` and `/app/templates`. */
export function TemplateHoverAffordance() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-[1] rounded-xl bg-slate-900/0 transition-colors duration-200 group-hover:bg-slate-900/38"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center px-2 pb-5 pt-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:px-4 sm:pb-6"
        aria-hidden
      >
        <span
          className={cn(
            "inline-flex max-w-[min(100%,18rem)] items-center justify-center rounded-full px-6 py-2.5 text-center text-sm font-bold tracking-tight text-white shadow-[0_6px_20px_rgba(13,148,136,0.45)] sm:px-8 sm:py-3 sm:text-base",
            "bg-[#0f766e] ring-2 ring-white/35",
          )}
        >
          Edit This Template
        </span>
      </div>
    </>
  );
}

/** Ring + hover overlay around the card (parent must use Tailwind `group`). */
export function TemplateCardHoverChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white/80 ring-1 ring-slate-200/45 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,ring-width,ring-color,background-color] duration-200 group-hover:bg-white group-hover:shadow-[0_4px_20px_rgba(15,23,42,0.08)] group-hover:ring-2 group-hover:ring-slate-200/60">
      {children}
      <TemplateHoverAffordance />
    </div>
  );
}
